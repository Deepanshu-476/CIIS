const fs = require('fs');

// 1. Update CSS
let css = fs.readFileSync('d:/ciisnetwork/CIIS/src/hrCds/pages/hr/EmpAllTask.css', 'utf-8');

const targetCSS = `.new-user-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.new-user-stats .stat {
  text-align: center;
}

.new-user-stats .stat h5 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e3a8a;
}

.new-user-stats .stat span {
  font-size: 11px;
  color: #64748b;
}`;

const newCSS = `.new-user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.new-user-stats .stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.new-user-stats .stat h5 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 700 !important;
}

.new-user-stats .stat span {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

/* Assigned Box */
.new-user-stats .stat:nth-child(1) {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.new-user-stats .stat:nth-child(1) h5 { color: #1d4ed8 !important; }

/* Completed Box */
.new-user-stats .stat:nth-child(2) {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.new-user-stats .stat:nth-child(2) h5 { color: #15803d !important; }

/* Pending Box */
.new-user-stats .stat:nth-child(3) {
  background: #fef2f2;
  border-color: #fecaca;
}
.new-user-stats .stat:nth-child(3) h5 { color: #b91c1c !important; }

/* Completion Box */
.new-user-stats .stat:nth-child(4) {
  background: #fffbeb;
  border-color: #fde68a;
}
.new-user-stats .stat:nth-child(4) h5 { color: #b45309 !important; }
`;

if (css.includes('.new-user-stats {\r\n  display: flex;')) {
    css = css.replace(targetCSS.replace(/\n/g, '\r\n'), newCSS);
} else if (css.includes('.new-user-stats {\n  display: flex;')) {
    css = css.replace(targetCSS, newCSS);
}
fs.writeFileSync('d:/ciisnetwork/CIIS/src/hrCds/pages/hr/EmpAllTask.css', css);
console.log('CSS updated successfully');


// 2. Update JSX
let jsx = fs.readFileSync('d:/ciisnetwork/CIIS/src/hrCds/pages/hr/EmpAllTask.jsx', 'utf-8');

// Helper to make replacing easier
function replaceCode(target, replacement) {
    if (jsx.includes(target)) {
        jsx = jsx.replace(target, replacement);
    } else if (jsx.includes(target.replace(/\n/g, '\r\n'))) {
        jsx = jsx.replace(target.replace(/\n/g, '\r\n'), replacement);
    } else {
        console.error('Could not find target string in JSX:', target.substring(0, 50));
    }
}

// 2.1 Update Top Stats Grid
const targetStats = `<div className="new-stat-val">
              <h3>15</h3>
              <span>Pending</span>
            </div>
            <div className="new-stat-trend red">↑ 25%</div>
          </div>
          <p>Awaiting completion</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon cyan"><FiRefreshCw size={20}/></div>
            <div className="new-stat-val">
              <h3>4</h3>
              <span>In Progress</span>
            </div>
            <div className="new-stat-trend cyan">↓ 20%</div>
          </div>
          <p>Currently in progress</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon green"><FiCheckCircle size={20}/></div>
            <div className="new-stat-val">
              <h3>{Math.round(systemStats.avgCompletion) || 0}</h3>
              <span>Completed</span>
            </div>
            <div className="new-stat-trend green">↑ 18%</div>
          </div>
          <p>Successfully completed</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon red"><FiPause size={20}/></div>
            <div className="new-stat-val">
              <h3>2</h3>
              <span>On Hold</span>
            </div>`;

const newStats = `<div className="new-stat-val">
              <h3>{overallStats.pending || 0}</h3>
              <span>Pending</span>
            </div>
            <div className="new-stat-trend red"></div>
          </div>
          <p>Awaiting completion</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon cyan"><FiRefreshCw size={20}/></div>
            <div className="new-stat-val">
              <h3>{overallStats['in-progress'] || 0}</h3>
              <span>In Progress</span>
            </div>
            <div className="new-stat-trend cyan"></div>
          </div>
          <p>Currently in progress</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon green"><FiCheckCircle size={20}/></div>
            <div className="new-stat-val">
              <h3>{overallStats.completed || 0}</h3>
              <span>Completed</span>
            </div>
            <div className="new-stat-trend green"></div>
          </div>
          <p>Successfully completed</p>
        </div>
        <div className="new-stat-card">
          <div className="new-stat-top">
            <div className="new-stat-icon red"><FiPause size={20}/></div>
            <div className="new-stat-val">
              <h3>{overallStats.onhold || 0}</h3>
              <span>On Hold</span>
            </div>`;

replaceCode(targetStats, newStats);

// Remove fake trends from first two stats as well
const targetTrend1 = `<div className="new-stat-trend green">↑ 12%</div>`;
replaceCode(targetTrend1, ``);
const targetTrend2 = `<div className="new-stat-trend green">↑ 8%</div>`;
replaceCode(targetTrend2, ``);

// 2.2 Update Team Insights
const targetInsights = `<div className="new-insights-cards">
          <div className="new-insight-card red">
            <div className="icon"><FiAlertCircle /></div>
            <div className="text"><strong>4</strong> overdue tasks need attention</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card green">
            <div className="icon"><FiAward /></div>
            <div className="text"><strong>Jatin Kumar</strong> is top performer at <strong>86%</strong> completion rate</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card orange">
            <div className="icon"><FiUsers /></div>
            <div className="text"><strong>6</strong> employees have no assigned tasks</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card blue">
            <div className="icon"><FiCheckCircle /></div>
            <div className="text"><strong>9</strong> employees completed all assigned tasks</div>
            <FiChevronRight className="arrow" />
          </div>
        </div>`;

const newInsights = `<div className="new-insights-cards">
          <div className="new-insight-card red">
            <div className="icon"><FiAlertCircle /></div>
            <div className="text"><strong>{overallStats.overdue || 0}</strong> overdue tasks need attention</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card green">
            <div className="icon"><FiAward /></div>
            <div className="text"><strong>{(filteredUsers.reduce((top, user) => {
              const rate = getUserTaskStats(user).completionRate || 0;
              if (rate > top.rate) return { name: user.name, rate };
              return top;
            }, { name: 'No one', rate: -1 })).name}</strong> is top performer at <strong>{Math.max(0, filteredUsers.reduce((top, user) => Math.max(top, getUserTaskStats(user).completionRate || 0), 0))}%</strong> completion rate</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card orange">
            <div className="icon"><FiUsers /></div>
            <div className="text"><strong>{filteredUsers.filter(u => (u.taskStats?.total || 0) === 0).length}</strong> employees have no assigned tasks</div>
            <FiChevronRight className="arrow" />
          </div>
          <div className="new-insight-card blue">
            <div className="icon"><FiCheckCircle /></div>
            <div className="text"><strong>{filteredUsers.filter(u => {
              const stats = getUserTaskStats(u);
              return stats.total > 0 && stats.total === stats.completed;
            }).length}</strong> employees completed all assigned tasks</div>
            <FiChevronRight className="arrow" />
          </div>
        </div>`;
replaceCode(targetInsights, newInsights);

// 2.3 Make the employee cards clickable and fix the stats colors format if needed
const targetUserCard = `<div className="new-user-card" key={user._id || user.id}>`;
const newUserCard = `<div className="new-user-card" key={user._id || user.id} onClick={() => openUserTasksPage(user._id || user.id)} style={{cursor: 'pointer'}}>`;
replaceCode(targetUserCard, newUserCard);

// Remove the inline style overrides from the stat tags as CSS now handles colors
const targetStatHTML = `<div className="new-user-stats">
                        <div className="stat">
                          <h5>{userStats.total || 0}</h5>
                          <span>Assigned</span>
                        </div>
                        <div className="stat">
                          <h5 style={{color: '#10b981'}}>{userStats.completed || 0}</h5>
                          <span>Completed</span>
                        </div>
                        <div className="stat">
                          <h5 style={{color: '#ef4444'}}>{(userStats.total || 0) - (userStats.completed || 0)}</h5>
                          <span>Pending</span>
                        </div>
                        <div className="stat">
                          <h5 style={{color: progressColor}}>{completionRate}%</h5>
                          <span>Completion</span>
                        </div>
                      </div>`;
const newStatHTML = `<div className="new-user-stats">
                        <div className="stat">
                          <h5>{userStats.total || 0}</h5>
                          <span>Assigned</span>
                        </div>
                        <div className="stat">
                          <h5>{userStats.completed || 0}</h5>
                          <span>Completed</span>
                        </div>
                        <div className="stat">
                          <h5>{(userStats.total || 0) - (userStats.completed || 0)}</h5>
                          <span>Pending</span>
                        </div>
                        <div className="stat">
                          <h5>{completionRate}%</h5>
                          <span>Completion</span>
                        </div>
                      </div>`;
replaceCode(targetStatHTML, newStatHTML);

fs.writeFileSync('d:/ciisnetwork/CIIS/src/hrCds/pages/hr/EmpAllTask.jsx', jsx);
console.log('JSX updated successfully');
