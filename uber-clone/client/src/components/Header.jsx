import { useAuth } from "../AuthContext";
export default function Header({ children }) {
  const { user, logout } = useAuth();
  return (
    <header className="bar"><b>Uber Clone</b>
      <span>{children}</span>
      <span>{user.name} ({user.role}) <button className="link" onClick={logout}>Logout</button></span>
    </header>
  );
}
