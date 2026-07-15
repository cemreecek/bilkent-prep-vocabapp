import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const getCurrentSession = async () => {
  return await getServerSession(authOptions)
}
