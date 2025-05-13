import React, { useState, useEffect } from "react";
import axios from "axios";

// Easily change these background images!
const BG_AUTH = "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1400&q=80"; // For login/signup
const BG_MAIN = "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1400&q=80"; // For main pages
const API = "http://localhost:3000"; // Change if your backend uses another port

const styles = {
  app: bg => ({
    minHeight: "100vh",
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    fontFamily: "Segoe UI, sans-serif",
    color: "#fff",
    margin: 0,
    padding: 0,
    transition: "background-image 0.6s"
  }),
  container: {
    background: "rgba(0,0,0,0.75)",
    maxWidth: 500,
    margin: "40px auto",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  },
  h1: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: 700,
    fontSize: 28,
    color: "#ffd700",
    textShadow: "1px 1px 8px #000",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  navBtn: active => ({
    background: active ? "#ffd700" : "#333",
    color: active ? "#222" : "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
    marginRight: 8,
    transition: "all 0.2s"
  }),
  input: {
    width: "100%",
    margin: "8px 0",
    padding: "10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 16,
    color: "#222",
  },
  button: {
    background: "linear-gradient(90deg,#ffd700,#ff9800)",
    color: "#222",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 700,
    marginTop: 12,
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 2px 8px #0002",
    transition: "all 0.2s"
  },
  card: {
    background: "#fff2",
    margin: "12px 0",
    padding: 16,
    borderRadius: 10,
    boxShadow: "0 1px 6px #0003"
  },
  chatBox: {
    height: 160,
    overflowY: "auto",
    background: "#2228",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  chatMsg: me => ({
    textAlign: me ? "right" : "left",
    margin: "4px 0",
    color: me ? "#ffd700" : "#fff"
  }),
  scheduleItem: {
    background: "#2227",
    padding: 10,
    borderRadius: 7,
    margin: "6px 0"
  }
};

function App() {
  // State
  const [page, setPage] = useState("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  // Auth fields
  const [signupName, setSignupName] = useState("");
  const [signupSubjects, setSignupSubjects] = useState("");
  const [loginId, setLoginId] = useState("");

  // Data
  const [subjects, setSubjects] = useState([]);
  const [buddies, setBuddies] = useState([]);
  const [recs, setRecs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatTo, setChatTo] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedTime, setSchedTime] = useState("");

  // Info
  const [info, setInfo] = useState("");

  // ----------- Fetch data after login -----------
  useEffect(() => {
    if (!token) return;
    axios.get(API + "/messages", { headers: { sessiontoken: token } })
      .then(res => setMessages(res.data.messages)).catch(() => {});
    axios.get(API + "/schedule", { headers: { sessiontoken: token } })
      .then(res => setSchedule(res.data.schedule)).catch(() => {});
    axios.get(API + "/subjects", { headers: { sessiontoken: token } })
      .then(res => setSubjects(res.data.subjects)).catch(() => {});
    axios.get(API + "/buddies", { headers: { sessiontoken: token } })
      .then(res => setBuddies(res.data.matches)).catch(() => {});
    axios.get(API + "/recommendations", { headers: { sessiontoken: token } })
      .then(res => setRecs(res.data.recommendations)).catch(() => {});
  }, [token]);

  // ----------- Re-fetch messages on chat -----------
  useEffect(() => {
    if (!token) return;
    axios.get(API + "/messages", { headers: { sessiontoken: token } })
      .then(res => setMessages(res.data.messages)).catch(() => {});
  }, [chatTo, token]);

  // ----------- Auth -----------
  const handleSignup = async e => {
    e.preventDefault();
    setInfo("");
    if (!signupName || !signupSubjects) return setInfo("All fields required.");
    try {
      const res = await axios.post(API + "/signup", {
        name: signupName,
        subjects: signupSubjects.split(",").map(s => s.trim())
      });
      // Immediately log in after signup for best UX
      const loginRes = await axios.post(API + "/login", { userId: res.data.userId });
      setToken(loginRes.data.sessionToken);
      setUser({ id: res.data.userId });
      setInfo("Signup and login successful! Redirecting to your profile...");
      setSignupName(""); setSignupSubjects("");
      setTimeout(() => {
        setPage("profile");
        setInfo("");
      }, 1500);
    } catch {
      setInfo("Signup failed.");
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setInfo("");
    try {
      const res = await axios.post(API + "/login", { userId: loginId });
      setToken(res.data.sessionToken);
      setUser({ id: loginId });
      setInfo("Login successful! Redirecting...");
      setLoginId("");
      setTimeout(() => {
        setPage("profile");
        setInfo("");
      }, 1000);
    } catch {
      setInfo("Login failed. Check your User ID.");
    }
  };

  // ----------- Chat -----------
  const sendMessage = async e => {
    e.preventDefault();
    if (!chatTo || !chatMsg) return;
    await axios.post(API + "/message", { toUserId: chatTo, text: chatMsg }, { headers: { sessiontoken: token } });
    setChatMsg("");
    axios.get(API + "/messages", { headers: { sessiontoken: token } })
      .then(res => setMessages(res.data.messages));
  };

  // ----------- Schedule -----------
  const addSchedule = async e => {
    e.preventDefault();
    if (!schedTitle || !schedTime) return;
    await axios.post(API + "/schedule", { title: schedTitle, datetime: schedTime }, { headers: { sessiontoken: token } });
    setSchedTitle(""); setSchedTime("");
    axios.get(API + "/schedule", { headers: { sessiontoken: token } })
      .then(res => setSchedule(res.data.schedule));
  };

  // ----------- UI Components -----------
  function NavBar() {
    return (
      <div style={styles.nav}>
        <button style={styles.navBtn(page === "profile")} onClick={() => setPage("profile")}>Profile</button>
        <button style={styles.navBtn(page === "buddies")} onClick={() => setPage("buddies")}>Find Buddies</button>
        <button style={styles.navBtn(page === "recs")} onClick={() => setPage("recs")}>Recommendations</button>
        <button style={styles.navBtn(page === "chat")} onClick={() => setPage("chat")}>Chat</button>
        <button style={styles.navBtn(page === "schedule")} onClick={() => setPage("schedule")}>Planner</button>
        <button style={styles.navBtn(false)} onClick={() => { setToken(""); setUser(null); setPage("login"); }}>Logout</button>
      </div>
    );
  }

  function ProfilePage() {
    return (
      <div>
        <h2 style={{color:'#ffd700'}}>Welcome, {user?.id}</h2>
        <div style={styles.card}>
          <b>Your Subjects:</b>
          <ul>
            {subjects.map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  function BuddiesPage() {
    return (
      <div>
        <h2 style={{color:'#ffd700'}}>Matched Buddies</h2>
        {buddies.length === 0 && <div>No buddies found. Try adding more subjects!</div>}
        {buddies.map(b => (
          <div style={styles.card} key={b.id}>
            <b>{b.name}</b> <br/>
            <span style={{fontSize:14}}>Subjects: {b.subjects.join(", ")}</span>
            <div>
              <button style={styles.button} onClick={() => { setChatTo(b.id); setPage("chat"); }}>Chat</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function RecommendationsPage() {
    return (
      <div>
        <h2 style={{color:'#ffd700'}}>Smart Recommendations</h2>
        {recs.length === 0 && <div>No recommendations yet.</div>}
        {recs.map(r => (
          <div style={styles.card} key={r.id}>
            <b>{r.name}</b> <br/>
            <span style={{fontSize:14}}>Common Subjects: {r.commonSubjects.join(", ")}</span>
            <div>
              <button style={styles.button} onClick={() => { setChatTo(r.id); setPage("chat"); }}>Chat</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function ChatPage() {
    const myId = user?.id;
    const chatMsgs = messages.filter(m => (m.from === myId && m.to === chatTo) || (m.from === chatTo && m.to === myId));
    return (
      <div>
        <h2 style={{color:'#ffd700'}}>Chat</h2>
        <div>
          <input
            style={styles.input}
            placeholder="Enter Buddy User ID to chat"
            value={chatTo}
            onChange={e => setChatTo(e.target.value)}
          />
        </div>
        <div style={styles.chatBox}>
          {chatMsgs.map(m => (
            <div key={m.id} style={styles.chatMsg(m.from === myId)}>
              <b>{m.from === myId ? "Me" : "Buddy"}:</b> {m.text}
              <div style={{fontSize:10}}>{new Date(m.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} style={{display:'flex'}}>
          <input
            style={{...styles.input, flex:1}}
            placeholder="Type your message..."
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
          />
          <button style={styles.button}>Send</button>
        </form>
      </div>
    );
  }

  function SchedulePage() {
    return (
      <div>
        <h2 style={{color:'#ffd700'}}>Study Planner</h2>
        <form onSubmit={addSchedule}>
          <input
            style={styles.input}
            placeholder="Title"
            value={schedTitle}
            onChange={e => setSchedTitle(e.target.value)}
          />
          <input
            style={styles.input}
            type="datetime-local"
            value={schedTime}
            onChange={e => setSchedTime(e.target.value)}
          />
          <button style={styles.button}>Add Reminder</button>
        </form>
        <div>
          <h4 style={{marginTop:20}}>Your Reminders:</h4>
          {schedule.map(s => (
            <div key={s.id} style={styles.scheduleItem}>
              <b>{s.title}</b> <br/>
              <span style={{fontSize:12}}>{new Date(s.datetime).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----------- Main Render -----------
  // Use BG_AUTH for login/signup, BG_MAIN for all other pages
  const isAuthPage = !token && (page === "login" || page === "signup");
  const background = isAuthPage ? BG_AUTH : BG_MAIN;

  return (
    <div style={styles.app(background)}>
      <div style={styles.container}>
        <div style={styles.h1}>📚 Study Buddy Finder</div>
        {token && <NavBar />}
        {info && <div style={{color:"#ffd700",marginBottom:10}}>{info}</div>}

        {/* Auth Pages */}
        {!token && page === "login" && (
          <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                style={styles.input}
                placeholder="Enter your User ID"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
              />
              <button style={styles.button}>Login</button>
            </form>
            <div style={{marginTop:16}}>
              <button style={styles.button} onClick={() => setPage("signup")}>Create New Account</button>
            </div>
          </div>
        )}
        {!token && page === "signup" && (
          <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup}>
              <input
                style={styles.input}
                placeholder="Your Name"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Subjects (comma separated)"
                value={signupSubjects}
                onChange={e => setSignupSubjects(e.target.value)}
              />
              <button style={styles.button}>Sign Up</button>
            </form>
            <div style={{marginTop:16}}>
              <button style={styles.button} onClick={() => setPage("login")}>Back to Login</button>
            </div>
          </div>
        )}

        {/* Main Pages */}
        {token && page === "profile" && <ProfilePage />}
        {token && page === "buddies" && <BuddiesPage />}
        {token && page === "recs" && <RecommendationsPage />}
        {token && page === "chat" && <ChatPage />}
        {token && page === "schedule" && <SchedulePage />}
      </div>
      <div style={{textAlign:"center",color:"#ffd70099",marginTop:20,fontSize:14}}>
        Background images can be changed in code.<br/>
        <a href={isAuthPage ? BG_AUTH : BG_MAIN} target="_blank" rel="noopener noreferrer" style={{color:"#ffd700"}}>View Current Background</a>
      </div>
    </div>
  );
}

export default App;