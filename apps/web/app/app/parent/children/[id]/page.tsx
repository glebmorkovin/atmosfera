import { ChildProfile } from "../_components/child-profile";

type Props = {
  params: { id: string };
};

export default function ParentChildProfilePage({ params }: Props) {
  return <ChildProfile playerId={params.id} mode="view" />;
}
