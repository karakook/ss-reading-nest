import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  BookOpen,
  Eye,
  Ellipsis,
  House,
  History,
  NotebookPen,
  LoaderCircle,
  Maximize2,
  MessageSquareText,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Settings2,
  Sparkles,
  Star,
  type LucideIcon
} from "lucide-react";
import teaBooksArt from "../assets/dessert-room/tea-books.webp";
import catBooksArt from "../assets/dessert-room/cat-books.webp";
import cookieRowArt from "../assets/dessert-room/cookie-row.webp";
import weeklyBooksArt from "../assets/dessert-room/weekly-books.webp";
import type {
  DrawerItem,
  Quote as StoredQuote,
  ReadingRecord as StoredReadingRecord,
  SessionBundle,
  SourceAvailability
} from "@ss/shared";
import {
  DEFAULT_READING_PARTNER_COPY,
  type ReadingPartnerCopy
} from "../features/reading-partner/config.js";

export type BookshelfItem = SessionBundle & {
  sourceAvailability: SourceAvailability;
};

type Filter = "all" | "active" | "completed" | "missing";
export type LibraryView = "library" | "records" | "excerpts" | "drawer" | "settings";
export type LibrarySkin = "blue" | "pink" | "beige" | "green";

type ReadingRecordView = {
  id: string;
  bookTitle: string;
  dateKey: string;
  dateLabel: string;
  weekday: string;
  timeRange: string;
  durationSeconds: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  bookTotalPages: number;
  bookProgressPercent: number;
  note: string;
  intensity: number;
};

type DailyReading = {
  id: string;
  label: string;
  seconds: number;
};

type ReadingReward = {
  pawCount: number;
  unlockedLetters: number;
  cycleProgress: number;
  todaySeconds: number;
  todayPages: number;
  todayQualified: boolean;
};

type BarStyle = CSSProperties & { "--bar-height": string };

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "active", label: "阅读中" },
  { value: "completed", label: "已完成" },
  { value: "missing", label: "正文缺失" }
];

const LIBRARY_NAV: Array<{
  label: string;
  accessibleLabel: string;
  icon: LucideIcon;
  view: LibraryView;
}> = [
  { label: "我的书房", accessibleLabel: "我的书房", icon: House, view: "library" },
  { label: "阅读记录", accessibleLabel: "阅读记录", icon: History, view: "records" },
  { label: "我的摘录", accessibleLabel: "我的摘录", icon: NotebookPen, view: "excerpts" },
  { label: "小抽屉", accessibleLabel: "小抽屉", icon: MessageSquareText, view: "drawer" },
  { label: "设置", accessibleLabel: "设置", icon: Settings, view: "settings" }
];

export function Home(props: {
  bookshelf: BookshelfItem[];
  readingRecords?: StoredReadingRecord[];
  loading?: boolean;
  loadError?: boolean;
  onRefresh?: () => void;
  onNew: () => void;
  onOpen: (item: BookshelfItem) => void;
  onContinue?: (item: BookshelfItem) => void;
  onReimport: (item: BookshelfItem) => void;
  onManage: (item: BookshelfItem) => void;
  onExpand?: () => void;
  drawerItems?: DrawerItem[];
  onDrawerOpen?: () => void;
  skin: LibrarySkin;
  onSkinChange: (skin: LibrarySkin) => void;
  partner?: ReadingPartnerCopy;
  initialView?: LibraryView;
}) {
  const partner = props.partner ?? DEFAULT_READING_PARTNER_COPY;
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<LibraryView>(props.initialView ?? "library");
  const novels = useMemo(
    () => props.bookshelf.filter((item) => item.session.type === "novel"),
    [props.bookshelf]
  );
  const visible = useMemo(
    () =>
      novels.filter((item) => {
        if (filter === "active" || filter === "completed") {
          return item.session.status === filter;
        }
        if (filter === "missing") {
          return [
            "cloud_missing",
            "cloud_restore_failed",
            "local_only_missing"
          ].includes(item.sourceAvailability);
        }
        return true;
      }),
    [filter, novels]
  );
  const continueItem = useMemo(
    () =>
      novels.find((item) => item.session.status === "active") ??
      novels[0] ??
      null,
    [novels]
  );
  const records = useMemo(
    () => buildReadingRecords(props.readingRecords ?? [], novels),
    [props.readingRecords, novels]
  );
  const reward = useMemo(
    () => buildReadingReward(props.readingRecords ?? []),
    [props.readingRecords]
  );
  const weeklyDays = useMemo(
    () => buildWeeklyReadingDays(props.readingRecords ?? []),
    [props.readingRecords]
  );
  const excerpts = useMemo(
    () => buildExcerptViews(novels),
    [novels]
  );
  const hasUnseenDrawer = props.drawerItems?.some((item) => !item.seen) ?? false;
  const headerCopy =
    view === "drawer"
      ? {
          title: "小抽屉",
          subtitle: "有些话不急着当下说，想起来的时候再来看看。"
        }
      : view === "records"
      ? {
          title: "阅读记录",
          subtitle: "看见每一次停在书页里的时间。"
        }
      : view === "excerpts"
      ? {
          title: "我的摘录",
          subtitle: "把舍不得忘记的句子，留在这里慢慢重读。"
        }
      : view === "settings"
      ? {
          title: "书房设置",
          subtitle: "把这间小书房调成最舒服的样子。"
        }
      : {
          title: continueItem
            ? continueReadingHeading(continueItem, partner)
            : `${partner.viewerName}的私人书房`,
          subtitle: "今天也在书页里，慢慢走一会儿吧。"
        };

  return (
    <main className={`library-app-shell dessert-reading-room is-${view}-view`}>
      <aside className="library-rail" aria-label="小书房导航">
        <div className="library-rail-brand">
          <Sparkles aria-hidden="true" />
          <strong>{partner.roomName}</strong>
          <span aria-hidden="true">✦ · ✧ · ✦</span>
        </div>
        <nav>
          {LIBRARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="library-rail-item"
                aria-label={item.accessibleLabel}
                aria-current={item.view === view ? "page" : undefined}
                onClick={() => {
                  setView(item.view);
                  if (item.view === "drawer") props.onDrawerOpen?.();
                }}
              >
                <Icon
                  className={`library-rail-icon${item.view === "drawer" && hasUnseenDrawer ? " drawer-icon-has-unseen" : ""}`}
                  aria-hidden="true"
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="library-rail-mascot" aria-hidden="true">
          <span className="rail-star rail-star-one">✦</span>
          <span className="rail-star rail-star-two">✧</span>
          <img src={catBooksArt} alt="" />
        </div>
      </aside>

      <section className="home-shell">
        <div className="library-mobile-brand">
          <span aria-hidden="true">✦</span>
          <strong>{partner.roomName}</strong>
          {props.onExpand ? (
            <button
              type="button"
              className="library-mobile-expand"
              aria-label="展开书房"
              title="展开书房"
              onClick={props.onExpand}
            >
              <Maximize2 aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" aria-label="打开设置" onClick={() => setView("settings")}>
            <Settings aria-hidden="true" />
          </button>
        </div>

        <header className="library-header">
          <div className="library-header-copy">
            <span className="visually-hidden">{partner.roomName}</span>
            <span className="library-kicker">
              {view === "library" ? "✦ MY READING NOOK ✦" : partner.roomName}
            </span>
            <h1 aria-label={headerCopy.title}>
              {view === "library" ? `欢迎回来，${partner.viewerName}` : headerCopy.title}
              {view === "library" ? (
                <>
                  <span className="library-header-paw-emoji" aria-hidden="true">🐾</span>
                  <HeaderPaw />
                </>
              ) : null}
            </h1>
            <p>{headerCopy.subtitle}</p>
            <div className="library-skin-switch" aria-label="界面皮肤">
              <button type="button" className="skin-star skin-star-blue" aria-label="水蓝" aria-pressed={props.skin === "blue"} onClick={() => props.onSkinChange("blue")}><Star aria-hidden="true" /></button>
              <button type="button" className="skin-star skin-star-pink" aria-label="粉桃" aria-pressed={props.skin === "pink"} onClick={() => props.onSkinChange("pink")}><Star aria-hidden="true" /></button>
              <button type="button" className="skin-star skin-star-beige" aria-label="米白" aria-pressed={props.skin === "beige"} onClick={() => props.onSkinChange("beige")}><Star aria-hidden="true" /></button>
              <button type="button" className="skin-star skin-star-green" aria-label="墨绿" aria-pressed={props.skin === "green"} onClick={() => props.onSkinChange("green")}><Star aria-hidden="true" /></button>
            </div>
          </div>
          {view !== "settings" ? (
            <div className="library-header-illustration" aria-hidden="true">
              <span className="header-sparkle sparkle-one">✦</span>
              <span className="header-sparkle sparkle-two">✧</span>
              <img src={teaBooksArt} alt="" />
            </div>
          ) : null}
        </header>

        <div className="library-mobile-tabs" aria-label="小书房视图">
          {LIBRARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.accessibleLabel}
                aria-pressed={view === item.view}
                onClick={() => {
                  setView(item.view);
                  if (item.view === "drawer") props.onDrawerOpen?.();
                }}
              >
                <Icon className="library-mobile-tab-icon" aria-hidden="true" strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {view === "library" ? (
          <div className="reading-dashboard">
            {filter === "all" ? <div className="dashboard-main-grid">
              {continueItem ? (
                <ContinueReadingCard
                  item={continueItem}
                  onOpen={props.onOpen}
                  onContinue={props.onContinue}
                  onManage={props.onManage}
                  partner={partner}
                />
              ) : (
                <section className="continue-card continue-card-empty" aria-label="继续阅读">
                  <BookOpen aria-hidden="true" />
                  <h2>从一本新书开始</h2>
                  <p>导入一本小说，我们就从第一页慢慢读起。</p>
                  <button type="button" className="action-primary" onClick={props.onNew}><Plus aria-hidden="true" />导入小说</button>
                </section>
              )}
              <div className="dashboard-side-stack">
                <TodayReadingCard reward={reward} />
                <WeeklyGoalCard days={weeklyDays} />
              </div>
            </div> : null}

            <div className="dashboard-bottom-grid">
              <section className="bookshelf-section" aria-label="小说书架">
              <h2 className="visually-hidden">书架</h2>
              <div className="section-heading">
                <div>
                  <span className="dessert-card-kicker">RECENT READS</span>
                  <h2>最近读过</h2>
                </div>
                <span>{novels.length} 本小说</span>
              </div>
              {props.loading && novels.length === 0 ? (
                <div className="empty-nest empty-nest-status" role="status">
                  <LoaderCircle className="empty-nest-icon is-spinning" aria-hidden="true" strokeWidth={1.8} />
                  <p>正在找回你的小说书架…</p>
                </div>
              ) : props.loadError && novels.length === 0 ? (
                <div className="empty-nest empty-nest-status" role="alert">
                  <RefreshCw className="empty-nest-icon" aria-hidden="true" strokeWidth={1.8} />
                  <p>书架暂时没有读取成功，小说仍在云端。</p>
                  {props.onRefresh ? (
                    <button type="button" className="book-action" onClick={props.onRefresh}>
                      <RefreshCw aria-hidden="true" strokeWidth={1.8} />
                      重新读取书架
                    </button>
                  ) : null}
                </div>
              ) : novels.length === 0 ? (
                <div className="empty-nest">书架里暂时没有小说。导入一本，我们就从第一页开始。</div>
              ) : visible.length === 0 ? (
                <div className="empty-nest">这个筛选下还没有小说。</div>
              ) : (
                <div className="library-book-grid">
                  {visible.map((item, index) => (
                    <LibraryBookCard
                      key={item.session.id}
                      item={item}
                      palette={index % 6}
                      onOpen={props.onOpen}
                    />
                  ))}
                </div>
              )}
              </section>
              {filter === "all" ? <ReadingRewardCard reward={reward} partner={partner} /> : null}
            </div>

            <div className="dashboard-utilities">
              {filter === "all" && continueItem && hasSharedMemory(continueItem) ? (
                <section className="shared-memory-note" aria-label="我们上次聊到这里">
                  <span className="shared-memory-kicker">我们上次聊到这里</span>
                  <p>{latestSharedMemory(continueItem, partner)}</p>
                  <small>{partner.companionName}会记得这句，等你下次翻到这里。</small>
                </section>
              ) : null}
              <div className="library-header-actions">
                {props.onExpand ? (
                  <button
                    type="button"
                    className="library-quiet-action"
                    aria-label="在页面底部展开书房"
                    onClick={props.onExpand}
                  >
                    <Maximize2 className="library-action-icon" aria-hidden="true" strokeWidth={1.8} />
                    <span>展开书房</span>
                  </button>
                ) : null}
                <button type="button" className="library-add" aria-label="小说共读：导入小说" onClick={props.onNew}>
                  <Plus className="library-action-icon" aria-hidden="true" strokeWidth={1.9} />
                  <span>导入小说</span>
                </button>
              </div>
            </div>
            <div className="bookshelf-filters reference-bookshelf-filters" aria-label="书架筛选">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : view === "excerpts" ? (
          <ExcerptsView excerpts={excerpts} />
        ) : view === "drawer" ? (
          <DrawerView items={props.drawerItems ?? []} />
        ) : view === "settings" ? (
          <SettingsView skin={props.skin} onSkinChange={props.onSkinChange} />
        ) : (
          <ReadingRecordsView records={records} />
        )}
      </section>
    </main>
  );
}

type ExcerptView = StoredQuote & {
  bookTitle: string;
};

function buildExcerptViews(items: BookshelfItem[]): ExcerptView[] {
  return items
    .flatMap((item) => item.quotes.map((quote) => ({
      ...quote,
      bookTitle: item.session.title
    })))
    .sort((left, right) => {
      const created = right.createdAt.localeCompare(left.createdAt);
      return created || right.id.localeCompare(left.id);
    });
}

function ExcerptsView(props: { excerpts: ExcerptView[] }) {
  if (props.excerpts.length === 0) {
    return (
      <section className="excerpts-empty" aria-label="我的摘录">
        <NotebookPen aria-hidden="true" strokeWidth={1.6} />
        <h2>还没有摘录</h2>
        <p>在阅读页划线、写下清思后，喜欢的句子会安静收在这里。</p>
      </section>
    );
  }

  return (
    <section className="excerpts-view" aria-label="我的摘录">
      <div className="excerpts-intro">
        <div>
          <span className="dessert-card-kicker">SAVED LINES</span>
          <h2>书页里留下的光</h2>
          <p>共 {props.excerpts.length} 条摘录，每一条都可以慢慢重读。</p>
        </div>
        <NotebookPen aria-hidden="true" strokeWidth={1.45} />
      </div>
      <div className="excerpts-grid">
        {props.excerpts.map((excerpt, index) => (
          <article className="excerpt-card" key={excerpt.id}>
            <span className="excerpt-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <blockquote>{excerpt.content}</blockquote>
            {excerpt.note || excerpt.clearThought ? (
              <p>{excerpt.clearThought ?? excerpt.note}</p>
            ) : null}
            <footer>
              <strong>《{excerpt.bookTitle}》</strong>
              <span>{excerpt.position.label}</span>
              <time dateTime={excerpt.createdAt}>{formatExcerptDate(excerpt.createdAt)}</time>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatExcerptDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function DrawerView(props: { items: DrawerItem[] }) {
  const items = [...props.items].sort((left, right) => {
    const created = right.createdAt.localeCompare(left.createdAt);
    return created || right.id.localeCompare(left.id);
  });

  return (
    <section className="drawer-view" aria-label="小抽屉">
      <div className="drawer-intro">
        <span className="drawer-kicker">留给以后打开</span>
        <p>有些话不急着在当下说，想起来的时候再来看看。</p>
        <small>这里不会弹通知，也不会催你。</small>
        <img className="drawer-intro-art" src={weeklyBooksArt} alt="" aria-hidden="true" />
      </div>

      {items.length === 0 ? (
        <div className="empty-nest drawer-empty">
          抽屉还是空的。巴巴有想留的话，会安静放在这里。
        </div>
      ) : (
        <div className="drawer-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`drawer-note${item.seen ? "" : " drawer-note-new"}`}
            >
              <div className="drawer-note-top">
                <span className="drawer-note-mark" aria-hidden="true">♡</span>
                <time dateTime={item.createdAt}>{formatDrawerTime(item.createdAt)}</time>
              </div>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function HeaderPaw() {
  return (
    <svg
      className="library-header-paw"
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <ellipse cx="20" cy="26" rx="10" ry="8.5" />
      <ellipse cx="8.5" cy="18" rx="4.2" ry="5.1" transform="rotate(-25 8.5 18)" />
      <ellipse cx="15.5" cy="10" rx="4.2" ry="5.3" transform="rotate(-9 15.5 10)" />
      <ellipse cx="25.2" cy="9.5" rx="4.2" ry="5.3" transform="rotate(9 25.2 9.5)" />
      <ellipse cx="32.2" cy="17.5" rx="4.2" ry="5.1" transform="rotate(25 32.2 17.5)" />
    </svg>
  );
}

function formatDrawerTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function TodayReadingCard(props: { reward: ReadingReward }) {
  const minutes = Math.max(0, Math.round(props.reward.todaySeconds / 60));
  const filledStars = Math.min(5, Math.max(0, Math.ceil(minutes / 5)));

  return (
    <section className="dessert-stat-card today-reading-card" aria-label="今日阅读">
      <div className="dessert-stat-heading">
        <span className="dessert-card-kicker">TODAY'S READING</span>
        <h2>今日阅读</h2>
      </div>
      <div className="today-reading-value">
        <strong>{minutes}</strong>
        <span>分钟</span>
      </div>
      <div className="today-reading-stars" aria-label={`今日阅读星星 ${Math.min(4, filledStars)} / 4`}>
        {Array.from({ length: 4 }, (_, index) => (
          <Star key={index} aria-hidden="true" className={index < filledStars ? "is-filled" : undefined} />
        ))}
      </div>
      <p>{props.reward.todayQualified ? "今天的阅读目标完成啦" : "再读一会儿，就能点亮小星星"}</p>
      <span className="today-cookie-art" style={{ backgroundImage: `url(${cookieRowArt})` }} aria-hidden="true" />
    </section>
  );
}

function WeeklyGoalCard(props: { days: boolean[] }) {
  const completed = props.days.filter(Boolean).length;
  const target = 5;

  return (
    <section className="dessert-stat-card weekly-goal-card" aria-label="本周目标">
      <div className="dessert-stat-heading">
        <span className="dessert-card-kicker">WEEKLY GOAL</span>
        <h2>本周目标</h2>
      </div>
      <div className="weekly-goal-copy"><strong>{completed}</strong><span> / {target} 天</span></div>
      <div className="weekly-goal-days" aria-label={`本周已阅读 ${completed} 天`}>
        {props.days.slice(0, 5).map((done, index) => (
          <span key={index} className={done ? "is-done" : undefined} aria-hidden="true">
            {done ? "✦" : index + 1}
          </span>
        ))}
      </div>
      <p>{completed >= target ? "本周的小目标已经完成" : "每一次翻页，都算数"}</p>
      <img className="weekly-books-art" src={weeklyBooksArt} alt="" aria-hidden="true" />
    </section>
  );
}

function SettingsView(props: {
  skin: LibrarySkin;
  onSkinChange: (skin: LibrarySkin) => void;
}) {
  const skins: Array<{ value: LibrarySkin; label: string; note: string }> = [
    { value: "blue", label: "奶油水蓝", note: "参考稿的默认甜点书房" },
    { value: "pink", label: "草莓粉桃", note: "更软、更甜一点" },
    { value: "beige", label: "饼干米白", note: "温暖安静的纸张感" },
    { value: "green", label: "抹茶墨绿", note: "更深、更沉静的阅读色" }
  ];

  return (
    <section className="dessert-settings" aria-label="书房设置">
      <div className="settings-intro-card">
        <Palette aria-hidden="true" />
        <div><span className="dessert-card-kicker">ROOM COLORS</span><h2>选择书房配色</h2><p>首页上方的小星星也可以随时切换。</p></div>
      </div>
      <div className="settings-skin-grid">
        {skins.map((skin) => (
          <button key={skin.value} type="button" className={`settings-skin-card skin-${skin.value}`} aria-pressed={props.skin === skin.value} onClick={() => props.onSkinChange(skin.value)}>
            <span className="settings-skin-swatch"><i /><i /><i /></span>
            <strong>{skin.label}</strong>
            <small>{skin.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ReadingRewardCard(props: {
  reward: ReadingReward;
  partner: ReadingPartnerCopy;
}) {
  const { reward, partner } = props;
  const remainingMinutes = Math.max(0, Math.ceil((5 * 60 - reward.todaySeconds) / 60));
  const remainingPages = Math.max(0, 3 - reward.todayPages);
  const remainingPaws = reward.cycleProgress === 7 ? 0 : 7 - reward.cycleProgress;
  const latestLetter = reward.unlockedLetters > 0
    ? rewardLetter(reward.unlockedLetters, partner)
    : null;

  return (
    <section className="reading-reward-card" aria-label={`${partner.viewerName}的阅读奖励`}>
      <div className="dessert-reward-heading">
        <div>
          <span className="dessert-card-kicker">READING TREAT</span>
          <h2>阅读小奖励 <span aria-hidden="true">✿</span></h2>
        </div>
        <span className="reward-bow" aria-hidden="true">⌁</span>
      </div>
      <img className="reward-cookie-row" src={cookieRowArt} alt="四块不同形状的小饼干" />
      <div className="dessert-reward-message">
        <p>{reward.todayQualified ? "今天的小饼干已经烤好啦！" : `再读 ${Math.max(1, remainingMinutes)} 分钟`}</p>
        <span>{reward.todayQualified ? "明天再来收下一块" : "可以获得一块小饼干！"}</span>
      </div>
      <div className="visually-hidden">
        <span>{reward.pawCount} 枚猫爪</span>
        <span>{reward.cycleProgress} / 7</span>
        <p>{reward.todayQualified ? "今天的猫爪已经盖好啦。" : `再读 ${remainingMinutes} 分钟，或者再翻 ${remainingPages} 页，就能盖下今天的猫爪。`}</p>
        <small>今天已读 {formatRewardMinutes(reward.todaySeconds)} · {reward.todayPages} 页</small>
        {latestLetter ? <><span>{partner.companionName}的小纸条 · 第 {reward.unlockedLetters} 封</span><p>{latestLetter}</p></> : <p>再收集 {remainingPaws} 枚，{partner.companionName}就留一张小纸条。</p>}
      </div>
    </section>
  );
}

function ReadingRecordsView(props: { records: ReadingRecordView[] }) {
  const totalSeconds = props.records.reduce((sum, record) => sum + record.durationSeconds, 0);
  const totalPages = props.records.reduce((sum, record) => sum + record.pagesRead, 0);
  const todayKey = dateKey(new Date());
  const todaySeconds = props.records
    .filter((record) => record.dateKey === todayKey)
    .reduce((sum, record) => sum + record.durationSeconds, 0);
  const averageSeconds = props.records.length > 0 ? Math.round(totalSeconds / props.records.length) : 0;
  const days = buildDailyReading(props.records);
  const maxSeconds = Math.max(1, ...days.map((day) => day.seconds));
  const trend = buildTrend(days, maxSeconds);

  if (props.records.length === 0) {
    return (
      <section className="reading-records-empty" aria-label="阅读记录">
        <Sparkles className="records-empty-icon" aria-hidden="true" strokeWidth={1.6} />
        <h2>还没有阅读记录</h2>
        <p>开始真实阅读后，这里会记录每次开始、结束和停留的页数。</p>
      </section>
    );
  }

  return (
    <section className="reading-records-view" aria-label="阅读记录">
      <div className="records-hero">
        <img className="records-hero-art" src={teaBooksArt} alt="" aria-hidden="true" />
        <div className="records-hero-copy">
          <span>14 天累计 · 真实数据</span>
          <h2>{formatDuration(totalSeconds)}</h2>
          <p>被安静地留在书页里</p>
          <small>日期、时间段、时长、页数和阅读节奏，都会从真实阅读会话里慢慢长出来。</small>
        </div>
        <blockquote>夜里翻页的声音，像在替我把书页收好。</blockquote>
      </div>

      <div className="records-metrics" aria-label="阅读统计">
        <RecordMetric label="今日阅读" value={formatDuration(todaySeconds)} detail="今天真实停留" />
        <RecordMetric label="累计时长" value={formatDuration(totalSeconds)} detail={`${props.records.length} 次阅读`} />
        <RecordMetric label="读过页数" value={`${totalPages} 页`} detail="真实累计" />
        <RecordMetric label="平均一次" value={formatDuration(averageSeconds)} detail="按会话估算" />
      </div>

      <div className="records-visual-grid">
        <section className="records-card records-heat-card">
          <header>
            <span>阅读节奏</span>
            <strong>近 14 天</strong>
          </header>
          <svg className="records-trend" viewBox="0 0 540 200" role="img" aria-label="近14天每日阅读分钟折线图">
            <defs>
              <linearGradient id="recordsTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9abdd2" stopOpacity=".3" />
                <stop offset="100%" stopColor="#9abdd2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line className="records-trend-base" x1="44" y1="168" x2="524" y2="168" />
            <path className="records-trend-area" d={trend.areaPath} />
            <polyline className="records-trend-line" points={trend.pointString} />
            {trend.points.map((point) => (
              <g key={point.id}>
                <circle className="records-trend-glow" cx={point.x} cy={point.y} r={point.isPeak ? 9 : 6} />
                <circle className="records-trend-dot" cx={point.x} cy={point.y} r="3.4" />
                {point.isPeak ? (
                  <path
                    className="records-trend-star"
                    d={`M${point.x},${point.y - 11} l3.2,5.8 l5.8,3.2 l-5.8,3.2 l-3.2,5.8 l-3.2,-5.8 l-5.8,-3.2 l5.8,-3.2 Z`}
                  />
                ) : null}
                <title>{point.label} · {formatDuration(point.seconds)}</title>
              </g>
            ))}
            <text className="records-trend-label" x="44" y="185" textAnchor="middle">{days[0]?.label}</text>
            <text className="records-trend-label" x="524" y="185" textAnchor="middle">{days.at(-1)?.label}</text>
          </svg>
        </section>

        <section className="records-card records-flow-card">
          <header>
            <span>时间流</span>
            <strong>每日停留</strong>
          </header>
          <div className="records-bars" aria-label="每日阅读时长">
            {days.map((day) => (
              <span key={day.id} className="records-bar-wrap">
                <span
                  className="records-bar"
                  style={{ "--bar-height": `${Math.max(10, (day.seconds / maxSeconds) * 100)}%` } as BarStyle}
                />
                <small>{day.label}</small>
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="records-timeline" aria-label="最近阅读明细">
        <div className="section-heading">
          <h2>最近阅读</h2>
          <span>{props.records.length} 条</span>
        </div>
        <div className="records-list">
          {props.records.map((record) => (
            <article key={record.id} className="record-entry">
              <div className="record-date">
                <strong>{record.dateLabel}</strong>
                <span>{record.weekday}</span>
              </div>
              <div className="record-body">
                <h3>{record.bookTitle}</h3>
                <p>{record.timeRange} · {formatDuration(record.durationSeconds)}</p>
                <div className="record-range">
                  <span>第 {record.startPage} 页</span>
                  <i aria-hidden="true" />
                  <span>第 {record.endPage} 页</span>
                </div>
                <small>{record.note}</small>
              </div>
              <div className="record-progress" aria-label={`已读 ${record.endPage} / ${record.bookTotalPages} 页`}>
                <span>已读 <b>{record.endPage}</b> / {record.bookTotalPages} 页</span>
                <i><b style={{ width: `${record.bookProgressPercent}%` }} /></i>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function RecordMetric(props: { label: string; value: string; detail: string }) {
  return (
    <article className="record-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.detail}</small>
    </article>
  );
}

function ContinueReadingCard(props: {
  item: BookshelfItem;
  onOpen: (item: BookshelfItem) => void;
  onContinue?: (item: BookshelfItem) => void;
  onManage: (item: BookshelfItem) => void;
  partner?: ReadingPartnerCopy;
}) {
  const partner = props.partner ?? DEFAULT_READING_PARTNER_COPY;
  const progress = progressInfo(props.item);
  const thoughtTotal = thoughtCount(props.item);
  const missing = needsSource(props.item);

  return (
    <section className="continue-card" aria-label="继续阅读">
      <DefaultCover item={props.item} palette={0} compact />
      <div className="continue-card-body">
        <span className="continue-status">{missing ? "正文需要补回" : "继续阅读"}</span>
        <h2
          className="continue-card-title"
          aria-label={props.item.session.title}
          data-title={shortTitle(props.item.session.title)}
        />
        <div className="continue-progress-row">
          <span>{props.item.session.userCurrentPosition.label}</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="continue-progress-track" aria-hidden="true">
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <p>{partner.viewerName}和{partner.companionName}留下了 {thoughtTotal} 条想法</p>
      </div>
      <div className="continue-card-actions">
        <button
          type="button"
          className="action-primary"
          onClick={() => {
            if (props.onContinue) props.onContinue(props.item);
            else props.onOpen(props.item);
          }}
        >
          <Eye aria-hidden="true" strokeWidth={1.8} />
          继续阅读
        </button>
        <button
          type="button"
          className="library-quiet-action"
          onClick={() => props.onManage(props.item)}
        >
          <Settings2 aria-hidden="true" strokeWidth={1.8} />
          管理这本书
        </button>
      </div>
    </section>
  );
}

function latestSharedMemory(item: BookshelfItem, partner: ReadingPartnerCopy): string {
  const latestNote = [...item.quotes]
    .reverse()
    .map((quote) => quote.note?.trim())
    .find(Boolean);
  if (latestNote) return latestNote;
  if (item.session.assistantSyncedPosition) {
    return `${partner.companionName}已经同步到${item.session.assistantSyncedPosition.label}，你们可以从这里接着聊。`;
  }
  return `${partner.viewerName}停在${item.session.userCurrentPosition.label}，这里还没有留下共同想法。`;
}

function hasSharedMemory(item: BookshelfItem): boolean {
  return Boolean(
    item.session.assistantSyncedPosition ||
      item.quotes.some((quote) => quote.note?.trim() || quote.clearThought?.trim())
  );
}

function continueReadingHeading(item: BookshelfItem, partner: ReadingPartnerCopy): string {
  const position = item.session.userCurrentPosition.label;
  const timePhrase = readingTimePhrase(item.session.lastReadAt);
  const companionPhrase = hasSharedMemory(item)
    ? `${partner.companionName}还记得。`
    : `${partner.companionName}等你继续。`;
  return `${partner.viewerName}，${timePhrase}停在${position}。${companionPhrase}`;
}

function readingTimePhrase(value: string | undefined, now = new Date()): string {
  if (!value) return "上次";
  const date = new Date(value);
  if (!isValidDate(date)) return "上次";
  if (dateKey(date) === dateKey(now)) return "今天";

  const yesterday = offsetDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -1);
  if (dateKey(date) === dateKey(yesterday)) {
    if (date.getHours() >= 18) return "昨晚";
    return `昨天${formatClock(date)}，`;
  }
  return `${date.getMonth() + 1}月${date.getDate()}日${formatClock(date)}，`;
}

function formatClock(date: Date): string {
  return ` ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function LibraryBookCard(props: {
  item: BookshelfItem;
  palette: number;
  onOpen: (item: BookshelfItem) => void;
}) {
  const progress = progressInfo(props.item);
  const missing = needsSource(props.item);

  return (
    <button
      type="button"
      className="library-book-card"
      aria-label={`打开《${props.item.session.title}》的封面页`}
      title={props.item.session.title}
      onClick={() => props.onOpen(props.item)}
    >
      <DefaultCover item={props.item} palette={props.palette} />
      <span className="library-book-info">
        <strong>{props.item.session.title}</strong>
        <small>
          {missing ? "正文缺失" : props.item.session.status === "completed" ? "已完成" : `阅读中 · ${progress.percent}%`}
        </small>
      </span>
      <Ellipsis className="library-book-more" aria-hidden="true" strokeWidth={1.8} />
    </button>
  );
}

function DefaultCover(props: { item: BookshelfItem; palette: number; compact?: boolean }) {
  return (
      <span className={`library-cover library-cover-${props.palette} ${props.compact ? "compact" : ""}`} aria-hidden="true">
        <span className="library-cover-shine" />
      <span className="library-cover-title" data-title={coverTitle(props.item.session.title)} />
      <span className="library-cover-mark">小书房</span>
    </span>
  );
}

function progressInfo(item: BookshelfItem): { percent: number; total: number | null } {
  const total = item.session.userCurrentPosition.total ?? item.session.sourceManifest?.paragraphCount ?? null;
  if (!total || total <= 0) return { percent: item.session.status === "completed" ? 100 : 0, total: null };
  const percent = Math.max(
    0,
    Math.min(100, Math.round((item.session.userCurrentPosition.index / total) * 100))
  );
  return { percent, total };
}

function needsSource(item: BookshelfItem): boolean {
  return !["available_local", "available_cloud", "restoring_from_cloud", "unknown"].includes(
    item.sourceAvailability
  );
}

function thoughtCount(item: BookshelfItem): number {
  const quoteNotes = item.quotes.filter((quote) => quote.note?.trim()).length;
  const clearThoughts = item.quotes.filter((quote) => quote.clearThought?.trim()).length;
  return quoteNotes + clearThoughts + item.reactions.length + item.bookmarks.length;
}

function shortTitle(title: string): string {
  return title.length > 18 ? `${title.slice(0, 18)}…` : title;
}

function coverTitle(title: string): string {
  const mainTitle = title.split(/[：:（(《]/)[0]?.trim();
  const displayTitle = mainTitle || title.trim();
  return displayTitle.length > 8 ? `${displayTitle.slice(0, 8)}…` : displayTitle;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function buildReadingRecords(
  records: StoredReadingRecord[],
  novels: BookshelfItem[]
): ReadingRecordView[] {
  const novelsById = new Map(novels.map((item) => [item.session.id, item]));
  return [...records]
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt))
    .flatMap((record) => {
      const started = new Date(record.startedAt);
      const ended = new Date(record.endedAt);
      if (!isValidDate(started) || !isValidDate(ended)) return [];
      const item = novelsById.get(record.sessionId);
      const total = totalPagesForRecord(record, item);
      const endPage = Math.max(1, Math.min(total, record.endPosition.index));
      const startPage = Math.max(1, Math.min(total, record.startPosition.index));
      const pagesRead = Math.max(1, Math.min(record.pagesRead, total));
      const durationSeconds = Math.max(1, Math.round(record.durationSeconds));

      return [
        {
          id: record.id,
          bookTitle: shortTitle(record.bookTitle || item?.session.title || "未命名作品"),
          dateKey: dateKey(ended),
          dateLabel: dateLabel(ended),
          weekday: WEEKDAYS[ended.getDay()] ?? "今天",
          timeRange: timeRangeFromDates(started, ended),
          durationSeconds,
          startPage,
          endPage,
          pagesRead,
          bookTotalPages: total,
          bookProgressPercent: Math.max(2, Math.min(100, Math.round((endPage / total) * 100))),
          note: readingRecordNote(record),
          intensity: Math.max(18, Math.min(100, Math.round((durationSeconds / 3600) * 100)))
        }
      ];
    });
}

function buildDailyReading(records: ReadingRecordView[]): DailyReading[] {
  const secondsByDate = new Map<string, number>();
  for (const record of records) {
    secondsByDate.set(record.dateKey, (secondsByDate.get(record.dateKey) ?? 0) + record.durationSeconds);
  }

  const baseDate = latestRecordDate(records) ?? new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const date = offsetDate(baseDate, index - 13);
    return {
      id: dateKey(date),
      label: shortDateLabel(date),
      seconds: secondsByDate.get(dateKey(date)) ?? 0
    };
  });
}

function buildReadingReward(records: StoredReadingRecord[], now = new Date()): ReadingReward {
  const totalsByDate = new Map<string, { seconds: number; pages: number }>();
  for (const record of records) {
    const ended = new Date(record.endedAt);
    if (!isValidDate(ended)) continue;
    const recordDateKey = dateKey(ended);
    const current = totalsByDate.get(recordDateKey) ?? { seconds: 0, pages: 0 };
    current.seconds += Math.max(0, Math.round(record.durationSeconds));
    current.pages += Math.max(0, Math.round(record.pagesRead));
    totalsByDate.set(recordDateKey, current);
  }

  const todayKey = dateKey(now);
  const today = totalsByDate.get(todayKey) ?? { seconds: 0, pages: 0 };
  const qualifyingDays = [...totalsByDate.entries()].filter(
    ([key, total]) => key <= todayKey && (total.seconds >= 5 * 60 || total.pages >= 3)
  );
  const pawCount = qualifyingDays.length;
  const unlockedLetters = Math.floor(pawCount / 7);
  const cycleProgress = pawCount === 0 ? 0 : ((pawCount - 1) % 7) + 1;

  return {
    pawCount,
    unlockedLetters,
    cycleProgress,
    todaySeconds: today.seconds,
    todayPages: today.pages,
    todayQualified: today.seconds >= 5 * 60 || today.pages >= 3
  };
}

function buildWeeklyReadingDays(records: StoredReadingRecord[], now = new Date()): boolean[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = start.getDay() || 7;
  start.setDate(start.getDate() - weekday + 1);
  const readDates = new Set(
    records
      .filter((record) => record.durationSeconds > 0 || record.pagesRead > 0)
      .map((record) => new Date(record.endedAt))
      .filter(isValidDate)
      .map(dateKey)
  );
  return Array.from({ length: 7 }, (_, index) => readDates.has(dateKey(offsetDate(start, index))));
}

function formatRewardMinutes(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? "不到 1 分钟" : "0 分钟";
  return `${Math.floor(seconds / 60)} 分钟`;
}

function rewardLetter(index: number, partner: ReadingPartnerCopy): string {
  const letters = [
    `${partner.viewerName}不是靠一口气读到这里的，是一次次愿意回来。${partner.companionName}把这七枚猫爪好好收起来了。`,
    `书页没有催${partner.viewerName}，可${partner.viewerName}还是又回来了。慢慢读也很好，${partner.companionName}一直在这一页旁边。`,
    `${partner.viewerName}已经把“偶尔翻开”读成了一条自己的路。今天这枚猫爪，也算我们共同留下的。`
  ];
  return letters[(index - 1) % letters.length] ?? letters[0]!;
}

function totalPagesForRecord(
  record: StoredReadingRecord,
  item: BookshelfItem | undefined
): number {
  return Math.max(
    1,
    record.endPosition.total ??
      record.startPosition.total ??
      item?.session.userCurrentPosition.total ??
      item?.session.sourceManifest?.paragraphCount ??
      record.endPosition.index,
    record.startPosition.index,
    record.pagesRead
  );
}

function readingRecordNote(record: StoredReadingRecord): string {
  if (record.startPosition.index === record.endPosition.index) {
    return "这一回停留在同一页，把时间真实记下来了。";
  }
  return `从${record.startPosition.label}读到${record.endPosition.label}，这一回翻过 ${record.pagesRead} 页。`;
}

function latestRecordDate(records: ReadingRecordView[]): Date | null {
  const latest = records[0]?.dateKey;
  if (!latest) return null;
  const date = new Date(`${latest}T12:00:00`);
  return isValidDate(date) ? date : null;
}

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

function offsetDate(base: Date, offsetDays: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + offsetDays);
  return next;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateLabel(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shortDateLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function timeRangeFromDates(started: Date, ended: Date): string {
  return `${clock(started.getHours() * 60 + started.getMinutes())}-${clock(
    ended.getHours() * 60 + ended.getMinutes()
  )}`;
}

function clock(totalMinutes: number): string {
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(minutesInDay / 60))}:${pad2(minutesInDay % 60)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (safeSeconds < 60) return safeSeconds > 0 ? `${safeSeconds} 秒` : "0 分钟";
  const minutes = Math.round(safeSeconds / 60);
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} 小时 ${rest} 分` : `${hours} 小时`;
}

function buildTrend(days: DailyReading[], maxSeconds: number) {
  const left = 44;
  const right = 524;
  const baseY = 168;
  const topY = 34;
  const span = Math.max(1, days.length - 1);
  const peak = Math.max(...days.map((day) => day.seconds));
  const points = days.map((day, index) => {
    const x = left + ((right - left) * index) / span;
    const y = baseY - ((baseY - topY) * day.seconds) / maxSeconds;
    return {
      ...day,
      x: roundForSvg(x),
      y: roundForSvg(y),
      isPeak: day.seconds > 0 && day.seconds === peak
    };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = `M${pointString.replaceAll(" ", " L")} L${right},${baseY} L${left},${baseY} Z`;
  return { points, pointString, areaPath };
}

function roundForSvg(value: number): number {
  return Math.round(value * 10) / 10;
}
