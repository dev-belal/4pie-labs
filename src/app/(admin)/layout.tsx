export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // data-admin-shell:
  //   - Activates the admin token scope defined in globals.css
  //     ([data-admin-shell] + [data-theme="light"] [data-admin-shell]).
  //   - Triggers `body:has([data-admin-shell])` which strips the public
  //     floating-nav padding-top:88px and frees the full viewport for the
  //     admin shell. h-screen below claims that freed space.
  return (
    <div
      data-admin-shell
      className="h-screen bg-background text-foreground"
    >
      {children}
    </div>
  );
}
