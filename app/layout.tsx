import { SiteHeader } from "@/components/SiteHeader";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TradingWeb 学习台",
    template: "%s · TradingWeb",
  },
  description: "拆开 ETF 持仓，看美股各板块龙头，再看大盘怎么走。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader />
        {children}
        <footer className="site-foot">
          <div className="wrap">
            学习用，不是投资建议。持仓来自基金公司公开清单，行情来自雅虎财经，都可能延迟一天，也可能和券商页面不完全一样。涨用朱红，跌用绿色。
          </div>
        </footer>
      </body>
    </html>
  );
}
