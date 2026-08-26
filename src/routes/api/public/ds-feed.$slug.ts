import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const Route = createFileRoute('/api/public/ds-feed/$slug')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { slug } = params
        
        // Fetch dropshipper
        const { data: ds, error: dsErr } = await supabase
          .from('dropshippers')
          .select('id, store_name, bio')
          .eq('store_slug', slug)
          .maybeSingle()
          
        if (dsErr || !ds) {
          return new Response('Store not found', { status: 404 })
        }
        
        let errorMsg = null
        let itemCount = 0
        let rss = ''

        try {
          // Fetch products
          const { data: imports, error: impErr } = await supabase
            .from('dropshipper_products')
            .select('*, product:products(*)')
            .eq('dropshipper_id', ds.id)
            .eq('is_active', true)
            
          if (impErr) throw impErr
          
          itemCount = imports?.length || 0

          const host = (process.env['VITE_APP_URL'] || process.env['APP_URL'] || new URL(request.url).origin).replace(/\/+$/, '')
          
          // Generate sanitized RSS feed for Facebook Shop
          rss = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(ds.store_name)} - Facebook Shop Feed</title>
    <link>${escapeXml(host)}/ds/${escapeXml(slug)}</link>
    <description>${escapeXml(ds.bio || 'Product catalog for ' + ds.store_name)}</description>
    ${(imports || []).map(item => {
      const p = (item as any).product
      if (!p) return ''
      const title = escapeXml(item.custom_title || p.name)
      const desc = escapeXml(item.custom_description || p.description || p.short_description || '')
      const link = `${escapeXml(host)}/ds/${escapeXml(slug)}?p=${escapeXml(p.id)}`
      const imgLink = escapeXml(p.image)
      const brand = escapeXml(p.brand || 'Generic')
      const price = Number(item.retail_price) || Number(p.price) || 0
      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imgLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price} BDT</g:price>
      <g:brand>${brand}</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
    </item>`
    }).join('')}
  </channel>
</rss>`

          // Log success
          await (supabase as any).from('dropshipper_feed_logs').insert({
            dropshipper_id: ds.id,
            item_count: itemCount,
            status: 'success'
          })
        } catch (e: any) {
          errorMsg = e.message
          // Log error
          await (supabase as any).from('dropshipper_feed_logs').insert({
            dropshipper_id: ds.id,
            item_count: itemCount,
            status: 'error',
            error_message: errorMsg
          })
          return new Response('Error generating feed', { status: 500 })
        }

        return new Response(rss, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
          }
        })
      }
    }
  }
})

