import { redirect } from "next/navigation";

/** Content and Library were two views of the same catalogue; Library is the one place now. */
export default function ContentPage(){redirect("/library")}
