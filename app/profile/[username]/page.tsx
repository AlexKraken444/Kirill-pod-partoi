import ProfileView from "./ProfileView";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return <ProfileView username={(await params).username} />;
}
