export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Tic Tac Toe Infinity",
    "description": "Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game with beautiful UI and real-time gameplay.",
    "url": "https://tic-tac-toe-infinity.onrender.com",
    "applicationCategory": "Game",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Dev2th3Core"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Dev2th3Core"
    },
    "screenshot": "https://tic-tac-toe-infinity.onrender.com/logo.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "featureList": [
      "Online multiplayer gameplay",
      "AI bot opponents",
      "Real-time game updates",
      "Responsive design",
      "Dark/Light theme",
      "Cross-platform compatibility"
    ],
    "genre": "Strategy Game",
    "gamePlatform": "Web Browser",
    "gameServer": "Real-time multiplayer"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 