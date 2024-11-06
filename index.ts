import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

// Initialize express app
const app = express();
const port = parseInt(process.env.PORT as string, 10) || 4192;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route for index.html
app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .send("KDN+ App server is running. Manually deployed successfully");
});

// Example route
app.get(
  "/example",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).send("Example route");
    } catch (error) {
      next(error);
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
