import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "administrador";

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light">
      <header className="bg-carbon text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/recepcion" className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-industrial" />
            <span className="font-bold">MOCER SAS</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/recepcion" className="hover:text-industrial">
              Recepción
            </Link>
            <Link href="/inspecciones" className="hover:text-industrial">
              Inspecciones
            </Link>
            {isAdmin ? (
              <>
                <Link href="/admin/revision" className="hover:text-industrial">
                  Revisión
                </Link>
                <Link href="/admin/catalogo" className="hover:text-industrial">
                  Catálogo
                </Link>
                <Link href="/admin/plantillas" className="hover:text-industrial">
                  Plantillas
                </Link>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-white/70">{profile?.full_name}</span>
            <form action={logout}>
              <button type="submit" className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="sm:hidden flex items-center gap-3 px-4 pb-3 text-sm overflow-x-auto">
          <Link href="/recepcion" className="hover:text-industrial whitespace-nowrap">
            Recepción
          </Link>
          <Link href="/inspecciones" className="hover:text-industrial whitespace-nowrap">
            Inspecciones
          </Link>
          {isAdmin ? (
            <>
              <Link href="/admin/revision" className="hover:text-industrial whitespace-nowrap">
                Revisión
              </Link>
              <Link href="/admin/catalogo" className="hover:text-industrial whitespace-nowrap">
                Catálogo
              </Link>
              <Link href="/admin/plantillas" className="hover:text-industrial whitespace-nowrap">
                Plantillas
              </Link>
            </>
          ) : null}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
