import { LoginPage } from '@/pages/login';
import { API_BASE_URL } from '@/shared/config/apiConfig';

export default function Page() {
  return <LoginPage apiBaseUrl={API_BASE_URL} />;
}
