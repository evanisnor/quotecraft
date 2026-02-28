import { RegisterPage } from '@/pages/register';
import { API_BASE_URL } from '@/shared/config/apiConfig';

export default function Page() {
  return <RegisterPage apiBaseUrl={API_BASE_URL} />;
}
