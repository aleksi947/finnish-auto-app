import { Link } from "react-router-dom";

function HomeButton() {
  return (
    <Link to="/" style={{ textDecoration: "none" }}>
      <button style={{ marginRight: 10 }}>🏠 Домой</button>
    </Link>
  );
}

export default HomeButton;
