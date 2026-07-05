export type GA4StandardEvent = {
  name: string
  category: string
  description: string
  parameters: string[]
}

export type GA4StandardParameter = {
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  example: string
}

// Recommended events and their parameters, based on Google's GA4 "Recommended
// events" reference (https://support.google.com/analytics/answer/9267735).
// This is a documentation starting point, not a validator - every field it
// prefills stays freely editable per document.
export const GA4_STANDARD_EVENTS: GA4StandardEvent[] = [
  // E-commerce
  { name: 'view_item_list', category: 'E-commerce', description: 'User is shown a list of items/products.', parameters: ['item_list_id', 'item_list_name', 'items'] },
  { name: 'select_item', category: 'E-commerce', description: 'User selects an item from a list.', parameters: ['item_list_id', 'item_list_name', 'items'] },
  { name: 'view_item', category: 'E-commerce', description: 'User views a product detail page.', parameters: ['currency', 'value', 'items'] },
  { name: 'add_to_cart', category: 'E-commerce', description: 'User adds an item to the cart.', parameters: ['currency', 'value', 'items'] },
  { name: 'remove_from_cart', category: 'E-commerce', description: 'User removes an item from the cart.', parameters: ['currency', 'value', 'items'] },
  { name: 'view_cart', category: 'E-commerce', description: 'User views the cart.', parameters: ['currency', 'value', 'items'] },
  { name: 'begin_checkout', category: 'E-commerce', description: 'User starts the checkout process.', parameters: ['currency', 'value', 'coupon', 'items'] },
  { name: 'add_shipping_info', category: 'E-commerce', description: 'User submits shipping information during checkout.', parameters: ['currency', 'value', 'coupon', 'shipping_tier', 'items'] },
  { name: 'add_payment_info', category: 'E-commerce', description: 'User submits payment information during checkout.', parameters: ['currency', 'value', 'coupon', 'payment_type', 'items'] },
  { name: 'purchase', category: 'E-commerce', description: 'User completes a purchase.', parameters: ['currency', 'value', 'transaction_id', 'coupon', 'shipping', 'tax', 'affiliation', 'items'] },
  { name: 'refund', category: 'E-commerce', description: 'A purchase (or part of one) is refunded.', parameters: ['currency', 'value', 'transaction_id', 'items'] },
  { name: 'add_to_wishlist', category: 'E-commerce', description: 'User adds an item to a wishlist.', parameters: ['currency', 'value', 'items'] },
  // Engagement
  { name: 'page_view', category: 'Engagement', description: 'A page is viewed. Fired automatically by gtag.js/GTM in most setups.', parameters: ['page_location', 'page_title', 'page_referrer'] },
  { name: 'scroll', category: 'Engagement', description: 'User scrolls to the bottom of a page (90% by default). Fired automatically when enhanced measurement is on.', parameters: ['percent_scroll'] },
  { name: 'click', category: 'Engagement', description: 'User clicks a link that leads away from the current domain (outbound click).', parameters: ['link_url', 'link_text', 'link_classes', 'link_domain', 'link_id', 'outbound'] },
  { name: 'view_search_results', category: 'Engagement', description: 'User views results of an on-site search.', parameters: ['search_term'] },
  { name: 'search', category: 'Engagement', description: 'User performs an on-site search.', parameters: ['search_term'] },
  { name: 'share', category: 'Engagement', description: 'User shares content.', parameters: ['content_type', 'item_id'] },
  { name: 'file_download', category: 'Engagement', description: 'User downloads a file (pdf, docx, xlsx, zip, ...).', parameters: ['file_extension', 'file_name', 'link_url', 'link_text'] },
  { name: 'video_start', category: 'Engagement', description: 'An embedded video starts playing.', parameters: ['video_current_time', 'video_duration', 'video_provider', 'video_title', 'video_url', 'visible'] },
  { name: 'video_progress', category: 'Engagement', description: 'An embedded video passes a progress milestone (10/25/50/75%).', parameters: ['video_current_time', 'video_duration', 'video_percent', 'video_provider', 'video_title', 'video_url', 'visible'] },
  { name: 'video_complete', category: 'Engagement', description: 'An embedded video finishes playing.', parameters: ['video_current_time', 'video_duration', 'video_provider', 'video_title', 'video_url', 'visible'] },
  { name: 'form_start', category: 'Engagement', description: 'User interacts with a form for the first time in a session.', parameters: ['form_id', 'form_name', 'form_destination'] },
  { name: 'form_submit', category: 'Engagement', description: 'User submits a form.', parameters: ['form_id', 'form_name', 'form_destination'] },
  // Auth
  { name: 'login', category: 'Auth', description: 'User logs in.', parameters: ['method'] },
  { name: 'sign_up', category: 'Auth', description: 'User signs up for an account.', parameters: ['method'] },
  // Ads / lead-gen
  { name: 'generate_lead', category: 'Ads', description: 'User submits a lead-generation form or otherwise qualifies as a lead.', parameters: ['currency', 'value'] },
  { name: 'earn_virtual_currency', category: 'Ads', description: 'User earns virtual currency (points, coins, ...).', parameters: ['virtual_currency_name', 'value'] },
  { name: 'spend_virtual_currency', category: 'Ads', description: 'User spends virtual currency on a virtual good.', parameters: ['virtual_currency_name', 'value', 'item_name'] },
]

export const GA4_STANDARD_PARAMETERS: GA4StandardParameter[] = [
  { name: 'item_id', type: 'string', description: 'SKU or unique identifier of the item.', example: 'SKU_12345' },
  { name: 'item_name', type: 'string', description: 'Name of the item.', example: 'Men’s T-Shirt' },
  { name: 'item_category', type: 'string', description: 'Category of the item.', example: 'Apparel' },
  { name: 'item_brand', type: 'string', description: 'Brand of the item.', example: 'Acme' },
  { name: 'item_variant', type: 'string', description: 'Variant of the item, e.g. size or color.', example: 'Blue / L' },
  { name: 'item_list_id', type: 'string', description: 'Identifier of the list the item was shown/selected in.', example: 'related_products' },
  { name: 'item_list_name', type: 'string', description: 'Name of the list the item was shown/selected in.', example: 'Related products' },
  { name: 'index', type: 'number', description: 'Position of the item within a list, starting at 0.', example: '0' },
  { name: 'items', type: 'string', description: 'Array of item objects (id, name, price, quantity, ...) - see GA4 Items array docs. Modeled here as a single field; document its shape in the description/dataLayer example.', example: '[{ item_id: "SKU_12345", item_name: "...", price: 19.99, quantity: 1 }]' },
  { name: 'price', type: 'number', description: 'Unit price of the item, excluding tax and shipping.', example: '19.99' },
  { name: 'quantity', type: 'number', description: 'Quantity of the item.', example: '1' },
  { name: 'currency', type: 'string', description: 'ISO 4217 currency code. Required whenever value is set.', example: 'PLN' },
  { name: 'value', type: 'number', description: 'Monetary value of the event.', example: '99.90' },
  { name: 'transaction_id', type: 'string', description: 'Unique identifier of the transaction/order.', example: 'T-1001' },
  { name: 'affiliation', type: 'string', description: 'Store or affiliation from which the transaction occurred.', example: 'Online Store' },
  { name: 'coupon', type: 'string', description: 'Coupon code applied.', example: 'SUMMER10' },
  { name: 'discount', type: 'number', description: 'Discount amount applied.', example: '10.00' },
  { name: 'shipping', type: 'number', description: 'Shipping cost.', example: '9.99' },
  { name: 'shipping_tier', type: 'string', description: 'Shipping method chosen, e.g. Ground, Air, Next-day.', example: 'Standard' },
  { name: 'tax', type: 'number', description: 'Tax amount.', example: '18.00' },
  { name: 'payment_type', type: 'string', description: 'Payment method chosen, e.g. Credit Card, PayPal.', example: 'Credit Card' },
  { name: 'user_id', type: 'string', description: 'App/site-assigned unique identifier for a logged-in user.', example: 'usr_9f3a1' },
  { name: 'session_id', type: 'string', description: 'Identifier of the current analytics session.', example: '1699999999' },
  { name: 'page_title', type: 'string', description: 'Title of the page.', example: 'Homepage' },
  { name: 'page_location', type: 'string', description: 'Full URL of the page.', example: 'https://example.com/' },
  { name: 'page_referrer', type: 'string', description: 'Referrer URL of the previous page.', example: 'https://google.com/' },
  { name: 'percent_scroll', type: 'number', description: 'Scroll depth percentage reached (fires at 90 by default).', example: '90' },
  { name: 'search_term', type: 'string', description: 'Term the user searched for.', example: 'running shoes' },
  { name: 'content_type', type: 'string', description: 'Type of content being interacted with/shared.', example: 'article' },
  { name: 'content_id', type: 'string', description: 'Identifier of the content being interacted with.', example: 'art-2024-01' },
  { name: 'method', type: 'string', description: 'Method used to log in, sign up, or share, e.g. Google, Facebook, Email.', example: 'Google' },
  { name: 'link_url', type: 'string', description: 'Destination URL of a clicked link.', example: 'https://partner.example.com' },
  { name: 'link_text', type: 'string', description: 'Text content of the clicked link.', example: 'Visit partner site' },
  { name: 'link_classes', type: 'string', description: 'CSS classes of the clicked link element.', example: 'btn btn-primary' },
  { name: 'link_domain', type: 'string', description: 'Domain of the destination URL.', example: 'partner.example.com' },
  { name: 'link_id', type: 'string', description: 'HTML id attribute of the clicked link element.', example: 'cta-hero' },
  { name: 'outbound', type: 'boolean', description: 'Whether the clicked link leads to a different domain.', example: 'true' },
  { name: 'file_extension', type: 'string', description: 'Extension of the downloaded file.', example: 'pdf' },
  { name: 'file_name', type: 'string', description: 'Path/name of the downloaded file.', example: '/files/brochure.pdf' },
  { name: 'video_current_time', type: 'number', description: 'Video playback position in seconds when the event fired.', example: '12' },
  { name: 'video_duration', type: 'number', description: 'Total duration of the video in seconds.', example: '120' },
  { name: 'video_percent', type: 'number', description: 'Percentage of the video played (10/25/50/75) - used by video_progress.', example: '50' },
  { name: 'video_provider', type: 'string', description: 'Video platform, e.g. YouTube, Vimeo.', example: 'YouTube' },
  { name: 'video_title', type: 'string', description: 'Title of the video.', example: 'Product demo' },
  { name: 'video_url', type: 'string', description: 'URL of the video.', example: 'https://youtube.com/watch?v=...' },
  { name: 'visible', type: 'boolean', description: 'Whether the video was visible in the viewport when the event fired.', example: 'true' },
  { name: 'form_id', type: 'string', description: 'HTML id attribute of the form.', example: 'newsletter-form' },
  { name: 'form_name', type: 'string', description: 'Name attribute of the form.', example: 'newsletter' },
  { name: 'form_destination', type: 'string', description: 'URL the form submits to.', example: 'https://example.com/subscribe' },
  { name: 'virtual_currency_name', type: 'string', description: 'Name of the virtual currency earned or spent.', example: 'Coins' },
]

const PARAM_TYPE_BY_NAME: Record<string, GA4StandardParameter['type']> = Object.fromEntries(
  GA4_STANDARD_PARAMETERS.map((p) => [p.name, p.type])
)

function placeholderForType(type: GA4StandardParameter['type'] | undefined): string {
  if (type === 'number') return '0'
  if (type === 'boolean') return 'false'
  return "''"
}

// Builds a dataLayer.push() scaffold for a standard event, using each
// parameter's known type to pick a sensible placeholder value.
export function buildDataLayerSnippet(eventName: string, parameterNames: string[]): string {
  const lines = parameterNames
    .filter((name) => name !== 'items')
    .map((name) => `  ${name}: ${placeholderForType(PARAM_TYPE_BY_NAME[name])},`)

  const hasItems = parameterNames.includes('items')
  const itemsBlock = hasItems
    ? `  items: [\n    { item_id: '', item_name: '', price: 0, quantity: 1 },\n  ],\n`
    : ''

  return `dataLayer.push({\n  event: '${eventName}',\n${lines.join('\n')}${lines.length ? '\n' : ''}${itemsBlock}});`
}
