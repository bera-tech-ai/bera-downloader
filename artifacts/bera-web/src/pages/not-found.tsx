export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "#0d0d0d" }}>
      <div className="text-center">
        <h1 className="text-4xl font-black" style={{ color: "#FF4500" }}>404</h1>
        <p className="text-foreground mt-2 font-semibold">Page not found</p>
      </div>
    </div>
  );
}
