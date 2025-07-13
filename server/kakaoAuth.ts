import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Kakao Strategy 설정
  const kakaoClientID = process.env.KAKAO_REST_API_KEY || "efd6227a29decd6d0ca51bfffeae124e";
  const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET || "BUlf3NldM43EU3fryYdZ28AsJsmrbGth";
  
  console.log("Kakao Strategy 설정:");
  console.log("- Client ID:", kakaoClientID);
  console.log("- Client Secret:", kakaoClientSecret ? "설정됨" : "설정안됨");
  console.log("- Callback URL: /api/auth/kakao/callback");
  
  passport.use(new KakaoStrategy({
    clientID: kakaoClientID,
    clientSecret: kakaoClientSecret,
    callbackURL: "/api/auth/kakao/callback"
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // 카카오 프로필에서 사용자 정보 추출
      const kakaoProfile = profile._json;
      const userInfo = {
        id: profile.id.toString(),
        email: kakaoProfile.kakao_account?.email || null,
        firstName: kakaoProfile.properties?.nickname || null,
        lastName: null,
        profileImageUrl: kakaoProfile.properties?.profile_image || null,
      };

      // 사용자 정보를 데이터베이스에 저장/업데이트
      const user = await storage.upsertUser(userInfo);
      
      return done(null, user);
    } catch (error) {
      console.error("Kakao auth error:", error);
      return done(error, null);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  // 카카오 로그인 라우트
  app.get("/api/login", (req, res, next) => {
    console.log("카카오 로그인 요청 시작");
    console.log("Request URL:", req.url);
    console.log("Request hostname:", req.hostname);
    passport.authenticate("kakao")(req, res, next);
  });

  // 카카오 콜백 라우트
  app.get("/api/auth/kakao/callback", 
    (req, res, next) => {
      console.log("카카오 콜백 요청 받음");
      console.log("Query params:", req.query);
      next();
    },
    passport.authenticate("kakao", { 
      failureRedirect: "/login-failed",
      successRedirect: "/",
      failureFlash: false
    }),
    (req, res) => {
      console.log("카카오 로그인 성공");
      res.redirect("/");
    }
  );

  // 로그인 실패 페이지
  app.get("/login-failed", (req, res) => {
    console.log("카카오 로그인 실패");
    res.status(401).json({ 
      error: "카카오 로그인에 실패했습니다.",
      message: "다시 시도해주세요."
    });
  });

  // 로그아웃 라우트
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};