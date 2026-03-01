import { EditorPage } from '@/views/editor';

interface EditorPageRouteProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPageRoute({ params }: EditorPageRouteProps) {
  const { id } = await params;
  return <EditorPage calculatorId={id} />;
}
