import { requireStaffPage } from "../../lib/server/staff";

export const dynamic="force-dynamic";

export default async function StaffOnlyLayout({children}:{children:React.ReactNode}){
  await requireStaffPage();
  return children;
}
