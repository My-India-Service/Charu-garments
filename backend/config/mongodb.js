import mongoose from "mongoose";

const DB_NAME = "e-commerce";

const withDatabaseName = (uri) => {
  const raw = String(uri || "").trim();
  if (!raw) {
    throw new Error("MONGODB_URI is missing");
  }

  const [withoutHash, hash = ""] = raw.split("#");
  const [base, query = ""] = withoutHash.split("?");
  const hashPart = hash ? `#${hash}` : "";
  const queryPart = query ? `?${query}` : "";

  // mongodb+srv://host[/db][/]  or  mongodb://host:port[/db]
  const match = base.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/(.*))?$/i);
  if (!match) {
    throw new Error("MONGODB_URI is invalid");
  }

  const origin = match[1].replace(/\/$/, "");
  return `${origin}/${DB_NAME}${queryPart}${hashPart}`;
};

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connected");
  });

  const uri = withDatabaseName(process.env.MONGODB_URI);
  await mongoose.connect(uri);
};

export default connectDB;
