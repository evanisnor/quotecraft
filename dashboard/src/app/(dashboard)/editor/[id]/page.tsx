interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;

  return (
    <main>
      <h1>Editor: {id}</h1>
    </main>
  );
}
