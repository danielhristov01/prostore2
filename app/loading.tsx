import Image from "next/image";

const LoadingPage = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Image
        src="/assets/loader.gif"
        height={150}
        width={150}
        alt="Loading..."
        priority
        style={{ width: 150, height: 150 }}
      />
    </div>
  );
};

export default LoadingPage;
