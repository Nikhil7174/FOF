import { Navbar } from "@/components/Navbar";
import { Leaderboard as LeaderboardComponent } from "@/components/Leaderboard";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <LeaderboardComponent />
      </div>
    </div>
  );
}

