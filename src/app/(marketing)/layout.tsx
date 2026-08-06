/**
 * Public marketing shell. Header, footer and the preview banner land here in
 * Phase 4; for now it only establishes the route group.
 */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return <div className="flex flex-1 flex-col">{children}</div>
}
