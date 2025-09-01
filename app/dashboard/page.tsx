import { redirect } from "next/navigation";
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

  let workspaceId = memberships?.[0]?.workspace_id as string | undefined;
  let workspaceName = (memberships?.[0] as any)?.workspaces?.name as string | undefined;

  // Zo niet: maak workspace + membership
  if (!workspaceId) {
    const { data: ws, error: wErr } = await supabase
      .from("workspaces")
      .insert({ name: "My Workspace", created_by: session.user.id })
      .select("id, name")
      .single();
    if (wErr) throw new Error(wErr.message);

    const { error: memErr } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: ws.id, user_id: session.user.id, role: "owner" });
    if (memErr) throw new Error(memErr.message);

    workspaceId = ws.id;
    workspaceName = ws.name;
  }

  return (
    <main className="max-w-3xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Welkom bij je workspace</h1>
      <p className="text-gray-600">
        Workspace: <strong>{workspaceName}</strong>
      </p>
      <div className="mt-6">
        <a className="underline text-blue-600" href="/">
          Naar QBR generator (stap 3)
        </a>
      </div>
      <form action="/signout" method="post" />
    </main>
  );
}
