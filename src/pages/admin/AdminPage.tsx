import { Link } from 'react-router-dom';

export default function AdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
      <p className="text-slate-600">Gestionează departamentele și echipele din cadrul organizației.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/admin/departments" 
          className="block p-6 border border-slate-200 rounded-lg shadow-sm bg-white hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Departamente</h2>
          <p className="text-sm text-slate-500">Adaugă, editează sau șterge departamentele companiei.</p>
        </Link>
        
        <Link 
          to="/admin/teams" 
          className="block p-6 border border-slate-200 rounded-lg shadow-sm bg-white hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Echipe</h2>
          <p className="text-sm text-slate-500">Gestionează echipele din departamente și responsabilii lor.</p>
        </Link>
      </div>
    </div>
  );
}
