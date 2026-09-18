import { getUsers } from "@/server/actions/admin.actions";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getUsers();
  
  return <UsersClient initialUsers={users} />;
}
