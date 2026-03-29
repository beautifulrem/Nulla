import { GuardianProfileScreen } from "../../../components/guardian/GuardianProfileScreen";

export default async function Page({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  return <GuardianProfileScreen profileId={profileId} />;
}
