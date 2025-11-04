import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile, getAllUsers } from "@/db/actions/user-actions";
import { getAllCrews } from "@/db/actions/crew-actions";
import { UserManagement } from "@/components/user-management";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { ROUTES } from "@/lib/routes";

export default async function UsersPage() {
  // Check authentication and authorization
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") {
    redirect(ROUTES.HOME);
  }

  // Fetch users and crews
  const users = await getAllUsers();
  const crews = await getAllCrews();

  return (
    <>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and assign them to crews
          </p>
        </div>
        <CreateUserDialog crews={crews} />
      </div>

      <UserManagement users={users} crews={crews} />
    </>
  );
}
