import { GuardianProfileScreen } from "../../../components/guardian/GuardianProfileScreen";

export default function Page({ params }: { params: { profileId: string } }) {
  return <GuardianProfileScreen profileId={params.profileId} />;
}
