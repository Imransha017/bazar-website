import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { setDsCode, trackDsClick } from '@/lib/dropshipper'

export const Route = createFileRoute('/go/$alias')({
  loader: async ({ params }) => {
    const { alias } = params
    
    const { data: link, error } = await supabase
      .from('dropshipper_short_links')
      .select('*, dropshippers(id, store_slug, code)')
      .eq('alias', alias)
      .maybeSingle()

      
    if (error || !link) {
      throw redirect({ to: '/' })
    }
    
    const ds = (link as any).dropshippers
    if (!ds) throw redirect({ to: '/' })
    
    // We can't track easily in loader, but we can pass the alias to the target page
    // and let the client-side handle the trackShortLinkEvent call upon arrival.
    
    let target = `/ds/${ds.store_slug}`
    if (link.product_id) {
      target += `?p=${link.product_id}&s=shortlink&c=${alias}&a=${alias}`
    } else {
      target += `?s=shortlink&c=${alias}&a=${alias}`
    }
    
    throw redirect({ to: target as any })

  }
})
