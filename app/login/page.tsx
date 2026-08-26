import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main className="landing"><header className="topline"><Link href="/" className="wordmark"><span className="mark">U</span><span>UFA League</span></Link><Link className="button button-secondary" href="/">League home</Link></header><section className="hero" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(18rem, .7fr)" }}><div><p className="eyebrow">Member access</p><h1>Enter your league workspace.</h1><p className="lede">Use the email address linked to your UFA League account. Unlinked members can ask the owner or Arish to connect their membership record.</p></div><LoginForm /></section></main>;
}
