import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/signin");

  // Bestaat er al een membership?
  const { data: memberships, error: mErr } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(name)")
    .eq("user_id", session.user.id)
    .limit(1);
  if (mErr) throw new Error(mErr.message);

  const membership = memberships?.[0] as { 
    workspace_id: string; 
    role: string; 
    workspaces?: { name: string } 
  } | undefined;
  
  let workspaceId = membership?.workspace_id;
  let workspaceName = membership?.workspaces?.name;

  // Zo niet: maak workspace + membership
  if (!workspaceId) {
    const { data: ws, error: wErr } = await supabase
      .from("workspaces")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ name: "My Workspace", created_by: session.user.id } as any)
      .select("id, name")
      .single();
    if (wErr) throw new Error(wErr.message);

    const workspace = ws as { id: string; name: string };
    
    const { error: memErr } = await supabase
      .from("workspace_members")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ workspace_id: workspace.id, user_id: session.user.id, role: "owner" } as any);
    if (memErr) throw new Error(memErr.message);

    workspaceId = workspace.id;
    workspaceName = workspace.name;
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Welkom bij je workspace</h1>
      <p className="text-gray-600">
        Workspace: <strong>{workspaceName}</strong>
      </p>
      <div className="mt-6">
        <Link className="underline text-blue-600" href="/qbr">
          Naar QBR generator (stap 3)
        </Link>
      </div>
      <form action="/signout" method="post" />
    </main>
  );
}
