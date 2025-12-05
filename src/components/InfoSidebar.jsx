function InfoSidebar({ title, children }) {
  return (
    <div style={styles.sidebar}>
      <h4 style={styles.title}>{title}</h4>
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    backgroundColor: "#f9fafe",
    borderLeft: "3px solid #0077cc",
    padding: "16px",
    marginLeft: "30px",
    borderRadius: "8px",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  title: {
    marginBottom: "10px",
    color: "#0077cc",
  },
  content: {
    color: "#333",
  },
};

export default InfoSidebar;
