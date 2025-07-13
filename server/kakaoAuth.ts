import passport from "passport";
import { Strategy as KakaoStrategy } from "passport-kakao";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// 카카오 OAuth 에러를 캐치하기 위한 래퍼
function logAndCatch(fn: any, context: string) {
  return (...args: any[]) => {
    try {
      console.log(`[${context}] 시작`);
      const result = fn(...args);
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          console.error(`[${context}] Promise 에러:`, error);
          throw error;
        });
      }
      console.log(`[${context}] 완료`);
      return result;
    } catch (error) {
      console.error(`[${context}] 동기 에러:`, error);
      throw error;
    }
  };
}

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
    callbackURL: "/api/auth/kakao/callback",
    scope: ['profile_nickname']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log("카카오 인증 성공!");
      console.log("Access Token:", accessToken ? "있음" : "없음");
      console.log("Profile ID:", profile.id);
      console.log("Profile Data:", JSON.stringify(profile._json, null, 2));
      
      // 카카오 프로필에서 사용자 정보 추출
      const kakaoProfile = profile._json;
      const userInfo = {
        id: profile.id.toString(),
        email: kakaoProfile.kakao_account?.email || null,
        firstName: kakaoProfile.properties?.nickname || null,
        lastName: null,
        profileImageUrl: kakaoProfile.properties?.profile_image || null,
      };

      console.log("추출된 사용자 정보:", userInfo);

      // 사용자 정보를 데이터베이스에 저장/업데이트
      const user = await storage.upsertUser(userInfo);
      console.log("DB 저장 완료:", user);
      
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
    console.log("=== 카카오 로그인 요청 시작 ===");
    console.log("Request URL:", req.url);
    console.log("Request hostname:", req.hostname);
    console.log("Full URL:", `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log("User-Agent:", req.get('User-Agent'));
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    
    // 직접 카카오 URL 생성해서 리디렉션 테스트
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientID}&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/api/auth/kakao/callback`)}&response_type=code&scope=profile_nickname`;
    console.log("생성된 카카오 인증 URL:", kakaoAuthUrl);
    
    passport.authenticate("kakao", {
      scope: ['profile_nickname'],
      failureMessage: true
    })(req, res, next);
  });

  // 카카오 콜백 라우트
  app.get("/api/auth/kakao/callback", 
    (req, res, next) => {
      console.log("=== 카카오 콜백 요청 받음 ===");
      console.log("Query params:", JSON.stringify(req.query, null, 2));
      console.log("Session ID:", req.sessionID);
      console.log("Session before auth:", JSON.stringify(req.session, null, 2));
      
      if (req.query.error) {
        console.error("❌ 카카오 OAuth 오류:", req.query.error);
        console.error("❌ 오류 설명:", req.query.error_description);
        return res.redirect("/login-failed?error=" + encodeURIComponent(req.query.error as string));
      }
      
      if (req.query.code) {
        console.log("✅ 인증 코드 받음:", req.query.code);
      }
      
      next();
    },
    (req, res, next) => {
      console.log("=== Passport 인증 시작 ===");
      passport.authenticate("kakao", { 
        failureRedirect: "/login-failed",
        failureFlash: false
      })(req, res, (err) => {
        if (err) {
          console.error("❌ Passport 인증 오류:", err);
          return res.redirect("/login-failed?error=passport_error");
        }
        console.log("✅ Passport 인증 성공");
        console.log("Session after auth:", JSON.stringify(req.session, null, 2));
        console.log("User object:", JSON.stringify(req.user, null, 2));
        next();
      });
    },
    (req, res) => {
      console.log("=== 카카오 로그인 최종 성공 ===");
      console.log("최종 사용자 정보:", JSON.stringify(req.user, null, 2));
      res.redirect("/");
    }
  );

  // 로그인 실패 페이지
  app.get("/login-failed", (req, res) => {
    console.log("❌ 카카오 로그인 실패");
    console.log("실패 원인:", req.query.error);
    res.status(401).json({ 
      error: "카카오 로그인에 실패했습니다.",
      message: "다시 시도해주세요.",
      details: req.query.error
    });
  });

  // 직접 카카오 URL로 리디렉션하는 테스트 라우트
  app.get("/api/test-kakao", (req, res) => {
    const redirect_uri = `${req.protocol}://${req.get('host')}/api/auth/kakao/callback`;
    const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientID}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=profile_nickname`;
    
    console.log("=== 직접 카카오 URL 테스트 ===");
    console.log("Client ID:", kakaoClientID);
    console.log("Redirect URI:", redirect_uri);
    console.log("Final Kakao URL:", kakaoUrl);
    
    res.redirect(kakaoUrl);
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