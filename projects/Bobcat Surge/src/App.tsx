import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PatientDashboardPage from "./pages/PatientDashboardPage";
import PatientListPage from "./pages/PatientListPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PatientListPage />} />
        <Route path="/patients/:id" element={<PatientDashboardPage />} />
      </Routes>
    </Layout>
  );
}
