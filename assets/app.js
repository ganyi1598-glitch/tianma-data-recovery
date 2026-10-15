
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  // ★ [data-stagger] 的显现机制挂在自身（CSS 规则是 [data-stagger].in>*），
  //   所以它也必须被观察 —— 否则子元素会永久停在 opacity:0。
  //   （踩过这个坑：只写 data-stagger 不写 data-reveal 的网格在线上整块不可见，
  //    而 opacity 不影响布局，高度类检查发现不了。）
  document.querySelectorAll('[data-stagger]').forEach(el => io.observe(el));
})();

const SC = { step: 0, data: { images: [], urgency: '一周内' } };

const WHY = {
  0: '先选一个最像的场景，会决定我们下一步问你什么细节。',
  1: '设备画像决定恢复路径和方案区间。机械硬盘与 SSD 的处理路径完全不同。',
  2: '故障细节决定风险等级。请尽量如实描述，因为不同回答会触发不同的下一步建议。',
  3: '已经做过的操作直接影响「还能做什么」，是评估风险等级最关键的信息之一。附图能帮我们更快定位。',
  4: '数据重要性影响我们排序与人工响应速度。',
  5: '你的自检报告已生成，可下载保存或截图发给工作室。',
};

const PROTECT = {
  deleted: '<b>立刻能做：</b>停止一切写入操作；不要再往这块盘/卡存任何新文件。',
  unrecog: '<b>立刻能做：</b>换一条数据线和电源适配器试一次；如果仍不识别，立即停止通电。',
  physical: '<b>立刻能做：</b>立即断电。反复通电可能让磁头划伤盘片，导致不可恢复。',
  liquid: '<b>立刻能做：</b>不要通电、不要用吹风机烘、不要放米缸。保持潮湿现状，送检。',
  nas: '<b>立刻能做：</b>记下报警盘位，不要触发 resync，不要热插拔未标记盘位。',
  phone: '<b>立刻能做：</b>不要接电、不要充电、不要尝试刷机。',
};

const DYNAMIC = {
  deleted: [
    { key:'when', label:'故障首次出现', options:[['< 1 小时','不到 1 小时'],['1 - 24 小时','1 — 24 小时'],['1 - 7 天','1 — 7 天'],['> 7 天','一周以上'],['不确定','不确定']]},
    { key:'fileType', label:'丢失的数据类型', options:[['全部','全部/不确定'],['文档','文档 / 表格'],['照片','照片 / 视频'],['聊天记录','微信 / 聊天记录'],['通讯录','通讯录 / 短信'],['录音','录音'],['工程文件','工程文件']]},
    { key:'estimate', label:'估计丢失文件数量', options:[['少量','几十个以内'],['中等','几十到几百'],['大量','上千以上'],['不清楚','不清楚']]}
  ],
  unrecog: [
    { key:'sys2', label:'换电脑 / 换线 / 换口试过吗', options:[['都试过','都试过'],['换线试过','换线试过'],['换电脑试过','换电脑试过'],['都没试过','都没试过']]},
    { key:'bios', label:'BIOS 或磁盘工具里能看到吗', options:[['能看到','能看到'],['能看到但读不出','能看到但读不出'],['完全看不到','完全看不到'],['不知道怎么查','不知道怎么查']]},
    { key:'sound', label:'接入瞬间是否有异响 / 震动', options:[['咔哒','咔哒 / 敲盘声'],['嗡嗡','嗡嗡声'],['完全无声','完全无声']]},
    { key:'encrypted', label:'是否加密盘', options:[['未加密','未加密'],['BitLocker','BitLocker'],['FileVault','FileVault'],['LUKS / VeraCrypt','LUKS / VeraCrypt'],['不知道','不知道']]}
  ],
  physical: [
    { key:'dropHeight', label:'跌落高度 / 冲击', options:[['桌上滑落','桌上 / 1 m 内'],['人高跌落','1 — 1.8 m'],['更高','更高'],['被压 / 被砸','被压 / 被砸'],['无跌落','无跌落但受过震动']]},
    { key:'deform', label:'可见损伤', options:[['无','无'],['轻微','外壳轻微变形'],['明显','外壳明显变形 / 裂纹'],['接口损坏','接口 / 触点损坏']]},
    { key:'noiseType', label:'异响类型', options:[['咔哒','规律咔哒 / 敲盘'],['嗡嗡','嗡嗡 / 持续'],['尖叫','尖叫声'],['无规律','无规律噪音'],['无','没有异响']]},
    { key:'tryPower', label:'之后是否通电试过', options:[['没试过','没试过'],['试过但不动','试过但不动'],['试过有反应','试过有反应']]}
  ],
  liquid: [
    { key:'liquidType', label:'液体类型', options:[['饮用水','饮用水 / 茶'],['咖啡','咖啡 / 含糖饮料'],['海水','海水 / 泳池水'],['污水','污水 / 汤汁'],['其他','其他']]},
    { key:'power', label:'进液时是否通电', options:[['未通电','未通电'],['曾通电','曾通电'],['不确定','不确定']]},
    { key:'dried', label:'是否做过干燥处理', options:[['没处理','没处理'],['自然晾干','自然晾干'],['吹风机','吹风机 / 烘箱'],['米缸 / 干燥剂','米缸 / 干燥剂']]}
  ],
  nas: [
    { key:'level', label:'阵列级别', options:[['RAID0','RAID 0'],['RAID1','RAID 1'],['RAID5','RAID 5'],['RAID6','RAID 6'],['RAID10','RAID 10'],['SHR','SHR / Synology Hybrid'],['JBOD','JBOD / 单盘'],['不知道','不知道']]},
    { key:'disks', label:'总盘数 / 报错盘数', options:[['2/2','2 盘 / 都报'],['4/1','4 盘 / 1 错'],['4/2','4 盘 / 2 错'],['5/1','5 盘 / 1 错'],['6/2','6 盘 / 2 错'],['>8','大于 8 盘'],['不确定','不确定']]},
    { key:'ops', label:'已做操作', options:[['更换过盘','已经更换过报错盘'],['触发了Resync','已触发 resync'],['还没动','什么都没动']]}
  ],
  phone: [
    { key:'boot', label:'当前开机状态', options:[['完全不开','完全不开'],['卡LOGO','卡 LOGO'],['开机黑屏','开机黑屏'],['自动重启','反复重启'],['能进','能进系统']]},
    { key:'before', label:'故障前做过什么', options:[['更新系统','更新系统'],['进水','进水'],['摔过','摔过'],['换屏','换过屏幕'],['什么都没做','什么都没做']]},
    { key:'locked', label:'是否启用锁屏 / 加密', options:[['有锁屏 + 密码','有锁屏 + 密码'],['仅密码','仅有密码'],['Face ID','Face ID'],['不知道密码','不知道密码']]}
  ]
};

function calcRisk(s){
  // 各场景基准风险（0-100）：逻辑删除最轻，开盘/进水最重
  const base = {deleted:28, unrecog:46, physical:72, liquid:62, nas:56, phone:42}[s.scenario] ?? 42;
  let score = base;
  // 故障细节里的具体危险信号（按严重度加权）
  const danger = {
    '咔哒':15,'尖叫':20,'敲盘':12,'完全看不到':12,'完全不开':12,
    'BitLocker':10,'FileVault':10,'LUKS':10,'海水':18,'污水':14,'含糖':10,
    '曾通电':10,'试过有反应':8,'明显':8,'接口损坏':10,'被压':12,'更高':8,
    '人高跌落':5,'外壳明显变形':8,'触发':12,'规律':10,'持续':6,'无规律':8
  };
  (DYNAMIC[s.scenario]||[]).forEach(f => {
    const v = s[f.key] || '';
    Object.keys(danger).forEach(d => { if(v.includes(d)) score += danger[d]; });
  });
  // 已做操作：危险操作加分，保护动作减分
  const actW = {
    '继续通电使用过':12,'运行过恢复软件':10,'重新格式化过':14,
    '换过线/换过接口':-3,'自行更换过盘位':10,'触发过Resync':15,
    '拆开过设备':8,'用吹风机烘过':10,'什么都没做过':-12
  };
  (s.actions || []).forEach(a => { score += actW[a] ?? 0; });
  if(s.power === '仍在通电') score += 10;
  if(s.power === '断电困难') score += 6;
  if(s.backup === '从未备份') score += 4;
  if(s.urgency === '今日加急') score += 3;
  score = Math.max(5, Math.min(98, Math.round(score)));
  const level = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  return {score, level};
}

// 方案预判：设备基准 × 故障类型 + 容量 + 风险 + 操作复杂度
function estimatePrice(s){
  const deviceBase = {'SD卡存储卡':350,'U盘':350,'机械硬盘':500,'固态硬盘':600,'手机':800,'NAS':2000};
  const sceneBase   = {deleted:350,unrecog:500,physical:600,liquid:800,nas:2000,phone:800};
  const mul = {deleted:1.0,unrecog:1.3,physical:1.8,liquid:1.6,nas:1.25,phone:1.0}[s.scenario] ?? 1.2;
  const capBump = {'< 128 GB':0,'128 GB — 500 GB':100,'500 GB — 2 TB':300,'> 2 TB':600}[s.capacity] ?? 0;
  let base = deviceBase[s.deviceType] ?? sceneBase[s.scenario] ?? 500;
  let price = base * mul + capBump;

  const acts = s.actions || [];
  if(acts.includes('重新格式化过')) price += 150;
  if(acts.includes('运行过恢复软件')) price += 120;
  if(acts.includes('触发过Resync')) price += 300;
  if(acts.includes('自行更换过盘位')) price += 200;

  const {level} = calcRisk(s);
  if(level === 'high') price *= 1.25;
  else if(level === 'low') price *= 0.9;

  const service = {
    deleted:'逻辑恢复（删除 / 格式化）',
    unrecog:'硬件 / 固件修复恢复',
    physical:'洁净间开盘恢复',
    liquid:'芯片级 / 主板修复',
    nas:'阵列重组 / 多盘恢复',
    phone:'内容恢复（照片 / 视频 / 聊天记录等）'
  }[s.scenario] || '综合检测与恢复';

  // 加密盘 / 锁屏无凭据提示
  let note = '';
  (DYNAMIC[s.scenario]||[]).forEach(f => {
    const v = s[f.key] || '';
    if(/BitLocker|FileVault|LUKS/.test(v)) note = '加密盘需提供解锁凭据，缺凭据成功率显著下降。';
  });
  if(s.scenario === 'phone' && s.locked === '不知道密码') note = '锁屏 / 加密且未知密码，成功率受限，需先评估。';

  const min = Math.max(200, Math.round(price * 0.85 / 50) * 50);
  const max = Math.round(price * 1.5 / 50) * 50;
  return {min, max, service, note, level};
}

const NEXT_STEPS = {
  deleted:[
    '立即停止所有写入操作。',
    '拍照记录现状，准备送检前不要再插电。',
    '如文件极重要，可先使用另一台设备做整盘只读备份镜像。'
  ],
  unrecog:[
    '更换数据线和电源适配器最后再试 1 次。',
    '如仍不识别，立即停止通电并送检。',
    '切勿反复插拔或尝试磁盘工具修复。加密盘需提供解锁凭据，缺失凭据成功率显著下降。'
  ],
  physical:[
    '不要通电，立即断电保存。',
    '扣好外壳避免二次损伤。',
    '反复通电可能让磁头划伤盘片，二次恢复难度会指数上升。'
  ],
  liquid:[
    '保持潮湿现状，立即停止通电。',
    '不要烘、不要放米缸、不要拆机。',
    '48 小时内送检，含糖 / 海水液体优先级最高。'
  ],
  nas:[
    '记录每块盘的槽位号和顺序。',
    '不要再触发 resync，不要热插拔未标记的盘。',
    '整套设备尽量一起送检。'
  ],
  phone:[
    '不要充电，不要尝试刷机。',
    '记录最后一次能正常使用的时间点。',
    '如启用锁屏且记得密码，请同时准备好密码和 Apple ID。'
  ]
};

const RECOMMEND = {
  deleted: '逻辑层恢复：只读镜像、扫描索引并按文件类型重组。需保持现场不变，避免任何写入。',
  unrecog: '硬件 / 固件修复：优先排查接口、供电、控制板，再用镜像工具做只读评估。',
  physical: '洁净间开盘：更换匹配磁头 / 电机组，再做只读镜像与文件重组。立刻断电，勿反复通电。',
  liquid: '芯片级检测 / 主板修复：腐蚀清理与关键芯片飞线读取数据，禁烘、禁米缸。',
  nas: '阵列重组：盘位顺序 / 块大小 / 校验方向采集后做虚拟重组。需整机组送检。',
  phone: '内容恢复（照片 / 视频 / 聊天记录等）：优先做整机导出；提供锁屏密码可显著提升成功率。'
};

const $stage = document.getElementById('stage');
const $why = document.getElementById('whyText');
const $tip = document.getElementById('protectTip');
const $bar = document.getElementById('bar');
const $stepLabel = document.getElementById('stepLabel');
const $resetBtn = document.getElementById('resetBtn');

function gotoStep(n, scroll = true){
  SC.step = n;
  document.querySelectorAll('.step-pane').forEach(p => p.classList.toggle('hide', Number(p.dataset.pane) !== n));
  $stepLabel.textContent = n===5 ? '现场信息 · 报告已生成' : `现场信息 · 第 ${n+1} 步 / 共 5 步`;
  $why.textContent = WHY[n] || '';
  $bar.style.width = (n===5 ? 100 : (n/4)*100) + '%';
  if(scroll) $stage.parentElement.scrollIntoView({behavior:'smooth', block:'start'});
}

gotoStep(0, false);

document.querySelectorAll('#scenarios .scenario-card').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('#scenarios .scenario-card').forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    SC.data.scenario = c.dataset.val;
    SC.data.scenarioText = c.querySelector('h6').textContent;
    document.getElementById('nextBtn').disabled = false;
    $tip.innerHTML = PROTECT[SC.data.scenario] || '先选一个场景';
  });
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if(!SC.data.scenario) return;
  gotoStep(1);
  $tip.innerHTML = '<b>提示：</b>机械硬盘与 SSD 是两条完全不同的处理路径，先确认设备类型。';
});

function bindOptions(){
  document.querySelectorAll('.options[data-key]').forEach(group => {
    if(group.dataset.bound) return;
    group.dataset.bound = '1';
    const key = group.dataset.key;
    const multi = group.dataset.multi === 'true';
    group.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => {
        if(multi){
          const NOTHING = '什么都没做过';
          if(inp.value === NOTHING && inp.checked){
            group.querySelectorAll('input').forEach(i => { if(i !== inp) i.checked = false; });
          } else if(inp.value !== NOTHING && inp.checked){
            const n = group.querySelector('input[value="' + NOTHING + '"]');
            if(n) n.checked = false;
          }
          const vals = [...group.querySelectorAll('input:checked')].map(i => i.value);
          SC.data[key] = vals;
        } else {
          SC.data[key] = inp.value;
        }
        group.querySelectorAll('.opt').forEach(o => {
          const i = o.querySelector('input');
          o.classList.toggle('on', i && i.checked);
        });
      });
    });
  });
}
bindOptions();

document.getElementById('brand').addEventListener('input', e => SC.data.brand = e.target.value);
document.getElementById('notes').addEventListener('input', e => SC.data.notes = e.target.value);
document.getElementById('urgency').addEventListener('input', e => {
  const labels = ['不急','一周内','3 天内','今日加急'];
  SC.data.urgency = labels[e.target.value];
  document.getElementById('urgencyVal').textContent = SC.data.urgency;
});

/* Image upload */
(() => {
  const MAX = 5;
  const dz = document.getElementById('dropzone');
  const fi = document.getElementById('fileInput');
  const th = document.getElementById('thumbs');

  function addFiles(files){
    const room = MAX - SC.data.images.length;
    [...files].slice(0, room).forEach(f => {
      if(!f.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = e => {
        SC.data.images.push({ name: f.name, dataURL: e.target.result });
        render();
      };
      r.readAsDataURL(f);
    });
  }
  function render(){
    th.innerHTML = '';
    SC.data.images.forEach((img, i) => {
      const d = document.createElement('div');
      d.className = 'thumb';
      d.innerHTML = `<img src="${img.dataURL}" alt="${img.name}"/><button aria-label="remove">×</button>`;
      d.querySelector('button').addEventListener('click', () => {
        SC.data.images.splice(i,1);
        render();
      });
      th.appendChild(d);
    });
  }
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  fi.addEventListener('change', e => { addFiles(e.target.files); fi.value=''; });
})();

document.getElementById('nextBtn2').addEventListener('click', () => {
  if(!SC.data.deviceType){alert('请先选择设备类型'); return}
  buildDynamic(SC.data.scenario);
  $tip.innerHTML = PROTECT[SC.data.scenario] || '请如实回答，这会决定下一步建议';
  gotoStep(2);
});

const SCENE_DESC = {
  deleted: '误删类恢复的关键是「之后有没有写入过新数据」，请如实选择。',
  unrecog: '「不识别」的下一步完全取决于 BIOS / 磁盘工具层面能否看到盘。',
  physical: '物理损伤最忌讳反复通电尝试，请如实回答。',
  liquid: '液体类型和是否通电决定腐蚀速度，请尽量准确。',
  nas: '阵列信息越完整，重组成功率越高。',
  phone: '本场景只接能开机手机，可恢复照片、视频、聊天记录、通讯录等内容。不开机的手机暂不受理。'
};

function buildDynamic(scenario){
  const dyn = DYNAMIC[scenario] || [];
  document.getElementById('dynamicDesc').textContent = SCENE_DESC[scenario] || '请告诉我具体的故障表现。越具体越能给出准确区间。';
  const root = document.getElementById('dynamicFields');
  root.innerHTML = '';
  dyn.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `
      <span class="field-label">${f.label}</span>
      <div class="options ${f.options.length>4?'cols-2':''}" data-key="${f.key}">
        ${f.options.map(([v,d]) => `<label class="opt"><input type="radio" name="${f.key}" value="${v}"/><div class="ico"></div><span class="txt">${d}</span></label>`).join('')}
      </div>
    `;
    root.appendChild(wrap);
  });
  bindOptions();
}

document.getElementById('nextBtn3').addEventListener('click', () => gotoStep(3));
document.getElementById('nextBtn4').addEventListener('click', () => gotoStep(4));
document.addEventListener('click', e => {
  if(e.target.matches('[data-back]')){
    gotoStep(Math.max(0, SC.step-1));
  }
});

document.getElementById('generateBtn').addEventListener('click', buildReport);

function buildReport(){
  const s = SC.data;
  const {score, level} = calcRisk(s);
  const price = estimatePrice(s);
  const riskMap = {
    high: {label:'高风险', cls:'high', tip:'建议立即停止所有操作并尽快送检'},
    mid:  {label:'中风险', cls:'mid',  tip:'现场可保存，需尽快人工核对'},
    low:  {label:'低风险', cls:'low',  tip:'常规流程，可到店或寄修检测'}
  };
  const r = riskMap[level];
  const steps = (NEXT_STEPS[s.scenario] || []).map(x => `<li>${x}</li>`).join('');
  const rec = RECOMMEND[s.scenario] || '现场信息采集与检测，预约后由人工先做风险分级。';
  const quoteHtml = `
    <div class="quote">
      <div class="q-top">
        <div class="q-service">服务类型<b>${price.service}</b></div>
        <div class="q-price">¥${price.min}–¥${price.max} <small>预估报价</small></div>
      </div>
      <div class="q-note">${price.note ? price.note + ' ' : ''}以上为检测前预判，最终以无损检测后评估为准。检测免费，恢复不成功不收费。</div>
    </div>
  `;

  const flags = [];
  if(s.actions?.includes('继续通电使用过')) flags.push('继续通电使用过');
  if(s.actions?.includes('运行过恢复软件')) flags.push('运行过恢复软件');
  if(s.actions?.includes('重新格式化过')) flags.push('重新格式化过');
  if(s.actions?.includes('触发过Resync')) flags.push('触发过 resync');
  if(s.actions?.includes('自行更换过盘位')) flags.push('自行更换过盘位');
  if(s.actions?.includes('拆开过设备')) flags.push('拆开过设备');

  const dynFields = DYNAMIC[s.scenario] || [];
  const dynRows = dynFields.map(f => {
    const v = s[f.key];
    const cls = v ? (v.includes('咔哒') || v.includes('触发') || v.includes('试过有反应') || v.includes('明显') || v.includes('曾通电') || v.includes('海水') || v.includes('污水') || v.includes('BitLocker') || v.includes('FileVault') || v.includes('LUKS') ? 'flag' : '') : 'muted';
    return `<li class="${cls}"><span>${f.label}</span><b>${v || '未填'}</b></li>`;
  }).join('');

  const imgsHtml = s.images?.length ? `
    <h4 style="margin-top:22px">附图（${s.images.length} 张）</h4>
    <div class="thumbs" style="margin-bottom:8px">
      ${s.images.map(img => `<div class="thumb"><img src="${img.dataURL}" alt="${img.name}"/></div>`).join('')}
    </div>
    <p style="font-size:13.5px;color:var(--ink-3);margin-top:6px">附图已保存在本机。下载报告后请单独截图或连同本页一起发送。</p>
  ` : '';

  const html = `
    <div class="report" style="grid-column:1 / -1">
      <div>
        <div class="risk ${r.cls}">
          <div class="risk-bar"></div>
          <div class="risk-bar-wrap">
            <b class="risk-tag">${r.label}</b>
            <small>${r.tip}</small>
          </div>
          <div style="text-align:right;font-family:var(--tnum);font-size:13.5px;color:var(--ink-3)">
            <div style="font-size:34px;color:var(--ink);font-weight:600">${score}<small style="font-size:14.5px;color:var(--ink-3)"> 分</small></div>
            <div>风险指数</div>
          </div>
        </div>

        ${flags.length ? `<div class="risk-bar-tags">${flags.map(f => `<span class="hot">⚑ ${f}</span>`).join('')}</div>` : ''}

        ${quoteHtml}

        <h4>设备画像</h4>
        <ul class="kv">
          <li><span>场景</span><b>${s.scenarioText || '-'}</b></li>
          <li><span>设备类型</span><b>${s.deviceType || '-'}</b></li>
          <li ${s.brand?'':'class="muted"'}><span>品牌型号</span><b>${s.brand || '未填'}</b></li>
          <li><span>容量</span><b>${s.capacity || '-'}</b></li>
          <li><span>系统</span><b>${s.system || '-'}</b></li>
        </ul>

        <h4 style="margin-top:22px">故障画像</h4>
        <ul class="kv">
          ${dynRows}
          <li><span>已做操作</span><b>${(s.actions||['未填']).join('、')}</b></li>
          <li><span>供电状态</span><b>${s.power || '-'}</b></li>
          <li><span>补充</span><b style="max-width:60%;text-align:right">${s.notes || '—'}</b></li>
        </ul>

        ${imgsHtml}
      </div>

      <div>
        <h4>数据画像</h4>
        <ul class="kv">
          <li><span>数据类型</span><b>${(s.dataType||['未填']).join('、')}</b></li>
          <li><span>数据量</span><b>${s.dataSize || '-'}</b></li>
          <li><span>备份</span><b>${s.backup || '-'}</b></li>
          <li><span>紧急程度</span><b>${s.urgency || '-'}</b></li>
        </ul>

        <div class="next" style="margin-top:22px">
          <h4 style="margin:0 0 10px">下一步</h4>
          <ol>${steps}</ol>
        </div>

        <div class="rec" style="margin-top:18px">
          <b>推荐服务</b>
          <div>${rec}</div>
        </div>

        <div style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="cta primary" onclick="downloadReportImage()">下载报告卡 JPG</button>
          <button class="cta" onclick="copyReport()">复制报告文本</button>
          <a class="cta ghost" href="#contact">联系人工 →</a>
        </div>
        <p style="margin-top:14px;font-size:13.5px;color:var(--ink-3)">本报告为自检初筛结果，最终方案以实际检测后的评估为准。</p>
      </div>
    </div>
  `;

  document.querySelector('[data-pane="5"]').innerHTML = html;
  document.querySelectorAll('.step-pane').forEach(p => p.classList.toggle('hide', Number(p.dataset.pane)!==5));
  $stepLabel.textContent = '现场信息 · 报告已生成';
  $bar.style.width = '100%';
  $why.textContent = '你的自检报告已生成，可下载保存或截图发给工作室。';
  $tip.innerHTML = '<b>建议：</b>先按上方"下一步"停止所有危险操作，再联系工作室。';
  SC.step = 5;
  document.querySelector('[data-pane="5"]').scrollIntoView({behavior:'smooth', block:'start'});
}

function resetCheck(){
  SC.data = { images: [], urgency: '一周内' };
  SC.step = 0;
  document.querySelectorAll('#scenarios .scenario-card').forEach(x => x.classList.remove('on'));
  const df = document.getElementById('dynamicFields'); if(df) df.innerHTML = '';
  const pv = document.getElementById('thumbs'); if(pv) pv.innerHTML = '';
  document.querySelectorAll('#check input[type="radio"], #check input[type="checkbox"]').forEach(i => i.checked = false);
  document.querySelectorAll('#check .opt.on').forEach(o => o.classList.remove('on'));
  document.querySelectorAll('#check .text-input, #check .textarea').forEach(t => t.value = '');
  const nb = document.getElementById('nextBtn'); if(nb) nb.disabled = true;
  const urg = document.getElementById('urgency');
  if(urg){ urg.value = 1; const u = document.getElementById('urgencyVal'); if(u) u.textContent = '一周内'; }
  const fi = document.getElementById('fileInput'); if(fi) fi.value = '';
  gotoStep(0, true);
}
$resetBtn.addEventListener('click', resetCheck);

function serializeReport(){
  const s = SC.data;
  const flags = [];
  if(s.actions?.includes('继续通电使用过')) flags.push('继续通电使用过');
  if(s.actions?.includes('运行过恢复软件')) flags.push('运行过恢复软件');
  if(s.actions?.includes('重新格式化过')) flags.push('重新格式化过');
  if(s.actions?.includes('触发过Resync')) flags.push('触发过 resync');
  if(s.actions?.includes('自行更换过盘位')) flags.push('自行更换过盘位');
  if(s.actions?.includes('拆开过设备')) flags.push('拆开过设备');

  const lines = [];
  lines.push('【故障自检报告 · 天马一站式数据服务中心】');
  lines.push(`日期：${new Date().toISOString().slice(0,16).replace('T',' ')}`);
  lines.push(`场景：${s.scenarioText || '-'}`);
  lines.push(`设备：${s.deviceType || '-'} ${s.brand || ''} · ${s.capacity || '-'}`);
  lines.push(`系统：${s.system || '-'}`);
  lines.push('');
  lines.push('--- 故障细节 ---');
  (DYNAMIC[s.scenario]||[]).forEach(f => lines.push(`${f.label}：${s[f.key]||'未填'}`));
  lines.push('');
  lines.push('--- 已做操作 ---');
  lines.push((s.actions||['未填']).join('、') || '未填');
  lines.push(`供电：${s.power || '-'}`);
  if(s.notes) lines.push(`补充：${s.notes}`);
  if(s.images?.length) lines.push(`附图：${s.images.length} 张（已合成进「报告卡 JPG」，可直接发送工作室）`);
  lines.push('');
  lines.push('--- 数据画像 ---');
  lines.push(`类型：${(s.dataType||['未填']).join('、')}`);
  lines.push(`数据量：${s.dataSize || '-'}`);
  lines.push(`备份：${s.backup || '-'}`);
  lines.push(`紧急：${s.urgency || '-'}`);
  lines.push('');
  lines.push('--- 现场红旗 ---');
  lines.push(flags.length ? flags.map(f=>'⚑ '+f).join('\n') : '无明显红旗');
  lines.push('');
  lines.push('--- 服务预判 ---');
  {
    const p = estimatePrice(s);
    lines.push(`服务：${p.service}`);
    lines.push(`方式：以无损检测与风险分级后，再到店给出具体方案（检测前为预判）。`);
    if(p.note) lines.push(`提示：${p.note}`);
  }
  lines.push('');
  lines.push('--- 下一步 ---');
  (NEXT_STEPS[s.scenario]||[]).forEach(x => lines.push('· '+x));
  return lines.join('\n');
}

function loadImg(src){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});}

async function downloadReportImage(){
 try {
  // 预加载微信二维码（同域，无 CORS 风险；使用全局 loadImg 以兼容上传图的 dataURL）
  const qrImg = await loadImg('wechat-qr.jpg');

  const s = SC.data;
  const {score, level} = calcRisk(s);
  const RMAP = {
    high:{label:'高风险', c:'#DC2626', tip:'建议立即停止所有操作并尽快送检'},
    mid: {label:'中风险', c:'#D97706', tip:'现场可保存，需尽快人工核对'},
    low: {label:'低风险', c:'#16A34A', tip:'常规流程，可到店或寄修检测'}
  };
  const R = RMAP[level];

  const flags = [];
  if(s.actions?.includes('继续通电使用过')) flags.push('继续通电使用过');
  if(s.actions?.includes('运行过恢复软件')) flags.push('运行过恢复软件');
  if(s.actions?.includes('重新格式化过')) flags.push('重新格式化过');
  if(s.actions?.includes('触发过Resync')) flags.push('触发过 resync');
  if(s.actions?.includes('自行更换过盘位')) flags.push('自行更换过盘位');
  if(s.actions?.includes('拆开过设备')) flags.push('拆开过设备');

  const secDev = [['场　　景', s.scenarioText||'-'],['设备类型', s.deviceType||'-'],['品牌型号', s.brand||'未填'],['容　　量', s.capacity||'-'],['系　　统', s.system||'-']];
  const secFault = (DYNAMIC[s.scenario]||[]).map(f=>[f.label, s[f.key]||'未填']);
  secFault.push(['已做操作', (s.actions||['未填']).join('、')], ['供电状态', s.power||'-']);
  if(s.notes) secFault.push(['补充说明', s.notes]);
  if(s.images?.length) secFault.push(['附　　图', s.images.length+' 张（已合成进报告卡）']);
  const secData = [['数据类型', (s.dataType||['未填']).join('、')],['数 据 量', s.dataSize||'-'],['备　　份', s.backup||'-'],['紧急程度', s.urgency||'-']];
  const steps = NEXT_STEPS[s.scenario]||[];
  const rec = RECOMMEND[s.scenario]||'';

  /* load uploaded photos (for embedding in the report card) */
  const upImgs = [];
  for(const im of (s.images||[])){
    const img = await loadImg(im.dataURL);
    if(img) upImgs.push({src:img, w:img.naturalWidth||1, h:img.naturalHeight||1});
  }

  const W=1080, PAD=64, CW=W-PAD*2, SCALE=2;
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  const SANS = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';

  function wrap(text, font, maxW){
    x.font = font;
    const out=[]; let line='';
    for(const ch of String(text)){
      if(ch==='\n'){out.push(line);line='';continue}
      if(line && x.measureText(line+ch).width>maxW){out.push(line);line=ch}
      else line+=ch;
    }
    if(line) out.push(line);
    return out.length?out:[''];
  }
  function rr(px,py,w,h,r){
    x.beginPath();
    if(x.roundRect){x.roundRect(px,py,w,h,r);return}
    x.moveTo(px+r,py);
    x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);
    x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);
    x.closePath();
  }

  /* ---- layout pass ---- */
  const L=[]; let y = 150 + 52;
  L.push({t:'risk', y, h:118}); y += 118 + 24;
  if(flags.length){
    const fl = wrap('⚑ '+flags.join('　⚑ '), `500 24px ${MONO}`, CW-44);
    L.push({t:'flags', y, lines:fl, h:fl.length*34+16}); y += fl.length*34+16 + 18;
  }
  {
    const p = estimatePrice(s);
    const priceLine = `¥${p.min} – ¥${p.max}`;
    const descTxt = `${p.service}${p.note ? ' · ' + p.note : ''} · 以无损检测后评估为准。检测免费，恢复不成功不收费。`;
    const ql = wrap(descTxt, `400 22px ${SANS}`, CW-48);
    const h = 130 + ql.length*32 + 16;
    L.push({t:'quote', y, priceLine, lines:ql, h}); y += h + 20;
  }
  function secLayout(title, kvs){
    const rows = kvs.map(([k,v])=>{
      const vl = wrap(v, `500 25px ${SANS}`, 600);
      return {k, vl, h: Math.max(40, vl.length*34+8)};
    });
    const h = 46 + rows.reduce((a,r)=>a+r.h,0) + 8;
    L.push({t:'sec', y, title, rows, h}); y += h + 18;
  }
  secLayout('设备画像', secDev);
  secLayout('故障画像', secFault);
  secLayout('数据画像', secData);
  {
    const rows = steps.map((st,i)=>({n:i+1, lines:wrap(st, `400 25px ${SANS}`, CW-96)}));
    const h = 46 + rows.reduce((a,r)=>a + r.lines.length*36 + 8,0) + 8;
    L.push({t:'next', y, rows, h}); y += h + 18;
  }
  {
    const lines = wrap(rec, `500 25px ${SANS}`, CW-48);
    const h = 52 + lines.length*36 + 20;
    L.push({t:'rec', y, lines, h}); y += h + 30;
  }
  if(upImgs.length){
    const cols = Math.min(2, upImgs.length);
    const gap = 16;
    const boxW = (CW - gap*(cols-1))/cols;
    const boxH = 440;
    upImgs.forEach(im=>{ const sc=Math.min(boxW/im.w, boxH/im.h, 1); im.tw=im.w*sc; im.th=im.h*sc; });
    const rows=[]; let cur=[];
    upImgs.forEach(im=>{ cur.push(im); if(cur.length===cols){rows.push(cur);cur=[];} });
    if(cur.length) rows.push(cur);
    let ph = 46;
    rows.forEach(r=>{ ph += Math.max(...r.map(im=>im.th)) + gap; });
    ph -= gap;
    L.push({t:'photos', y, rows, cols, gap, boxW, h:ph}); y += ph + 24;
  }
  L.push({t:'foot', y, h:280}); y += 280;
  const H = y + 30;

  /* ---- paint ---- */
  c.width = W*SCALE; c.height = H*SCALE;
  x.scale(SCALE, SCALE);
  x.fillStyle = '#FAFBFC'; x.fillRect(0,0,W,H);

  // header
  x.fillStyle = '#2563EB'; x.fillRect(0,0,W,150);
  const logo = await loadImg('logo.svg');
  if(logo){
    x.fillStyle = '#FFFFFF'; rr(PAD, 33, 84, 84, 20); x.fill();
    x.drawImage(logo, PAD+13, 44, 58, 58*626.88/613.51);
  }
  x.fillStyle = '#FFFFFF'; x.font = `600 34px ${SANS}`;
  x.fillText('天马一站式数据服务中心 · 故障自检报告', PAD+108, 78);
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = `400 20px ${MONO}`;
  x.fillText('DATA RECOVERY LAB · 武汉 · 仅保存在本机', PAD+108, 112);
  const dstr = new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  x.textAlign = 'right'; x.fillText(dstr, W-PAD, 78); x.textAlign = 'left';

  // ops
  for(const op of L){
    if(op.t==='risk'){
      x.fillStyle = '#FFFFFF'; rr(PAD, op.y, CW, op.h, 18); x.fill();
      x.strokeStyle = '#E6EAF0'; x.lineWidth = 1; rr(PAD, op.y, CW, op.h, 18); x.stroke();
      x.fillStyle = R.c; rr(PAD+24, op.y+26, 8, op.h-52, 4); x.fill();
      x.fillStyle = R.c; x.font = `600 32px ${SANS}`;
      x.fillText(R.label, PAD+52, op.y+52);
      x.fillStyle = '#64748B'; x.font = `400 22px ${SANS}`;
      x.fillText(R.tip, PAD+52, op.y+88);
      x.textAlign='right';
      x.fillStyle = '#0A1628'; x.font = `600 52px ${MONO}`;
      x.fillText(String(score), W-PAD-32, op.y+66);
      x.fillStyle = '#94A3B8'; x.font = `400 18px ${MONO}`;
      x.fillText('风险指数', W-PAD-32, op.y+94);
      x.textAlign='left';
    }
    if(op.t==='flags'){
      x.fillStyle = '#DC2626'; x.font = `500 24px ${MONO}`;
      op.lines.forEach((ln,i)=>x.fillText(ln, PAD+4, op.y+28+i*34));
    }
    if(op.t==='quote'){
      const g = x.createLinearGradient(PAD, op.y, W-PAD, op.y);
      g.addColorStop(0, '#0A1628'); g.addColorStop(1, '#13294B');
      x.fillStyle = g; rr(PAD, op.y, CW, op.h, 18); x.fill();
      x.fillStyle = 'rgba(255,255,255,.72)'; x.font = `600 20px ${MONO}`;
      x.fillText('预 估 报 价', PAD+24, op.y+38);
      x.fillStyle = '#FFFFFF'; x.font = `700 40px ${MONO}`;
      x.fillText(op.priceLine, PAD+24, op.y+86);
      x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `400 21px ${SANS}`;
      op.lines.forEach((ln,i)=>x.fillText(ln, PAD+24, op.y+120+i*30));
    }
    if(op.t==='sec'){
      x.fillStyle = '#2563EB'; rr(PAD, op.y+4, 8, 24, 4); x.fill();
      x.fillStyle = '#0A1628'; x.font = `600 27px ${SANS}`;
      x.fillText(op.title, PAD+20, op.y+26);
      let ry = op.y + 46;
      op.rows.forEach((r,idx)=>{
        x.fillStyle = '#94A3B8'; x.font = `400 21px ${MONO}`;
        x.fillText(r.k, PAD+2, ry+26);
        x.fillStyle = '#0A1628'; x.font = `500 25px ${SANS}`; x.textAlign='right';
        r.vl.forEach((ln,i)=>x.fillText(ln, W-PAD, ry+26+i*34));
        x.textAlign='left';
        if(idx < op.rows.length-1){
          x.strokeStyle = '#E6EAF0'; x.setLineDash([3,4]); x.lineWidth = 1;
          x.beginPath(); x.moveTo(PAD, ry+r.h-4); x.lineTo(W-PAD, ry+r.h-4); x.stroke();
          x.setLineDash([]);
        }
        ry += r.h;
      });
    }
    if(op.t==='next'){
      x.fillStyle = '#2563EB'; rr(PAD, op.y+4, 8, 24, 4); x.fill();
      x.fillStyle = '#0A1628'; x.font = `600 27px ${SANS}`;
      x.fillText('下一步建议', PAD+20, op.y+26);
      let ry = op.y + 46;
      op.rows.forEach(r=>{
        x.fillStyle = '#2563EB';
        x.beginPath(); x.arc(PAD+17, ry+18, 15, 0, Math.PI*2); x.fill();
        x.fillStyle = '#FFFFFF'; x.font = `600 18px ${MONO}`; x.textAlign='center';
        x.fillText(String(r.n), PAD+17, ry+24); x.textAlign='left';
        x.fillStyle = '#334155'; x.font = `400 25px ${SANS}`;
        r.lines.forEach((ln,i)=>x.fillText(ln, PAD+46, ry+26+i*36));
        ry += r.lines.length*36 + 8;
      });
    }
    if(op.t==='rec'){
      x.fillStyle = '#EFF4FD'; rr(PAD, op.y, CW, op.h, 18); x.fill();
      x.fillStyle = '#2563EB'; x.font = `600 20px ${MONO}`;
      x.fillText('推 荐 服 务', PAD+24, op.y+36);
      x.fillStyle = '#0A1628'; x.font = `500 25px ${SANS}`;
      op.lines.forEach((ln,i)=>x.fillText(ln, PAD+24, op.y+72+i*36));
    }
    if(op.t==='photos'){
      x.fillStyle = '#2563EB'; rr(PAD, op.y+4, 8, 24, 4); x.fill();
      x.fillStyle = '#0A1628'; x.font = `600 27px ${SANS}`;
      const total = op.rows.reduce((a,r)=>a+r.length,0);
      x.fillText(`实物照片 · 共 ${total} 张`, PAD+20, op.y+26);
      let ry = op.y + 46;
      op.rows.forEach(r=>{
        const rh = Math.max(...r.map(im=>im.th));
        let rx = PAD;
        r.forEach(im=>{
          const dx = rx + (op.boxW - im.tw)/2;
          const dy = ry + (rh - im.th)/2;
          rr(dx, dy, im.tw, im.th, 12); x.save(); x.clip();
          x.drawImage(im.src, dx, dy, im.tw, im.th); x.restore();
          x.strokeStyle = '#E6EAF0'; x.lineWidth = 1; rr(dx, dy, im.tw, im.th, 12); x.stroke();
          rx += op.boxW + op.gap;
        });
        ry += rh + op.gap;
      });
    }
    if(op.t==='foot'){
      const qrSize = 132;
      const qrX = W - PAD - qrSize;
      const qrY = op.y + 26;
      const textMaxW = qrX - PAD - 28;
      // 顶部分割线
      x.strokeStyle = '#D1D8E0'; x.setLineDash([3,4]); x.lineWidth = 1;
      x.beginPath(); x.moveTo(PAD, op.y+10); x.lineTo(W-PAD, op.y+10); x.stroke();
      x.setLineDash([]);
      // 微信二维码
      if(qrImg){
        x.fillStyle = '#FFFFFF'; rr(qrX-10, qrY-10, qrSize+20, qrSize+20, 16); x.fill();
        x.strokeStyle = '#E6EAF0'; x.lineWidth = 1; rr(qrX-10, qrY-10, qrSize+20, qrSize+20, 16); x.stroke();
        x.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        x.fillStyle = '#475569'; x.font = `600 20px ${SANS}`;
        x.fillText('扫码加微信咨询', qrX + qrSize/2 - 70, qrY + qrSize + 28);
      }
      // 文字区
      x.fillStyle = '#334155'; x.font = `600 22px ${SANS}`;
      x.fillText('电话（微信同号）', PAD, op.y+54);
      x.fillStyle = '#475569'; x.font = `400 21px ${SANS}`;
      x.fillText('程　186 9612 8515', PAD, op.y+86);
      x.fillText('程　130 0618 4912', PAD, op.y+114);
      x.fillText('王　184 0271 8242', PAD, op.y+142);
      x.fillText('甘　132 9414 6310', PAD, op.y+170);
      x.fillText('地址：武汉市江汉区民主一街 177 号 · 新星电脑城二楼 · 天马专业数据恢复中心', PAD, op.y+206);
      x.fillText('营业时间：周一至周日 10:00 — 18:00', PAD, op.y+234);
      x.fillStyle = '#94A3B8'; x.font = `400 20px ${SANS}`;
      x.fillText('本报告为自检初筛结果，最终方案以实际检测后评估为准；检测免费，不成功不收任何费用。', PAD, op.y+264, textMaxW);
    }
  }

  c.toBlob(b=>{
    if(!b){ alert('报告图片生成失败，请重试。'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `天马一站式数据服务中心-自检报告-${Date.now()}.jpg`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  }, 'image/jpeg', .92);
 } catch(err){
   console.error('downloadReportImage error:', err);
   alert('报告生成失败：' + (err && err.message ? err.message : err));
 }
}

function copyReport(){
  const txt = serializeReport();
  navigator.clipboard?.writeText(txt).then(
    () => alert('报告已复制到剪贴板，可直接粘贴发给工作室。'),
    () => prompt('复制失败，请手动复制：', txt)
  );
}

window.downloadReportImage = downloadReportImage;
window.copyReport = copyReport;

/* QR lightbox */
(() => {
  const lb = document.getElementById('qrLightbox');
  const open = () => { lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  document.getElementById('qrThumb').addEventListener('click', open);
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  const closeBtn = document.getElementById('qrClose');
  if (closeBtn) closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
})();

/* FAB consult */
(() => {
  const fab = document.getElementById('fab');
  const main = document.getElementById('fabMain');
  const lb = document.getElementById('qrLightbox');
  if (!fab || !main) return;
  const setOpen = open => {
    fab.classList.toggle('open', open);
    main.setAttribute('aria-expanded', String(open));
  };
  main.addEventListener('click', e => { e.stopPropagation(); setOpen(!fab.classList.contains('open')); });
  fab.addEventListener('click', e => e.stopPropagation());
  fab.querySelectorAll('[data-fab-addfriend]').forEach(b => b.addEventListener('click', () => {
    setOpen(false);
    // 优先展示二维码：长按识别 → 微信好友申请（最可靠、能直达加好友步骤的路径）
    if (lb) { lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }));
  // 二维码灯箱手动触发入口（如 contact 区"点击放大"已经被原 IIFE 处理）
  fab.querySelectorAll('[data-fab-qr]').forEach(b => b.addEventListener('click', () => {
    setOpen(false);
    if (lb) { lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }));
  document.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') setOpen(false); });
  // 页脚出现时自动隐藏 fab，避免遮挡"回到顶部"等控件
  const foot = document.querySelector('.foot');
  if (foot && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => fab.classList.toggle('hide', e.isIntersecting));
    }, { threshold: 0 });
    io.observe(foot);
  }
})();

/* Copy phone */
(() => {
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      return ok;
    }
  };
  document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      btn.classList.add('copied');
      const tip = btn.parentElement.querySelector('.copy-tip');
      if (tip) { tip.classList.add('show'); setTimeout(() => tip.classList.remove('show'), 1500); }
      setTimeout(() => btn.classList.remove('copied'), 1500);
    });
  });
})();

/* Mobile menu */
(() => {
  const b = document.getElementById('navBurger');
  const m = document.getElementById('mobileMenu');
  if(!b || !m) return;
  const set = open => {
    m.classList.toggle('open', open);
    b.classList.toggle('open', open);
    b.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  b.addEventListener('click', () => set(!m.classList.contains('open')));
  m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
})();

/* FAQ search */
(() => {
  const inp = document.getElementById('faqSearch');
  const list = document.getElementById('faqList');
  if(!inp || !list) return;
  const items = [...list.querySelectorAll('details')];
  const empty = document.getElementById('faqEmpty');
  inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    let shown = 0;
    items.forEach(d => {
      const hit = !q || d.textContent.toLowerCase().includes(q);
      d.style.display = hit ? '' : 'none';
      if(hit) shown++;
    });
    empty.classList.toggle('hide', shown > 0);
  });
})();

/* Nav shadow on scroll */
(() => {
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* Service cards -> pricing anchors */
(() => {
  document.querySelectorAll('.svc[data-target]').forEach(el => {
    const go = () => {
      const t = document.querySelector(el.dataset.target);
      if(!t) return;
      t.scrollIntoView({behavior:'smooth', block:'center'});
      t.classList.remove('flash'); void t.offsetWidth;
      t.classList.add('flash');
      setTimeout(() => t.classList.remove('flash'), 1800);
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }});
  });
})();

/* Metrics count-up */
(() => {
  const els = document.querySelectorAll('.metric b');
  if(!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      const node = el.childNodes[0];
      const raw = (node?.textContent || '').trim();
      const m = raw.match(/^[\d,]+(\.\d+)?/);
      if(!m) return;
      const num = parseFloat(m[0].replace(/,/g,''));
      const suffix = raw.slice(m[0].length);
      const dec = m[0].includes('.') ? 1 : 0;
      const fmt = v => (dec ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')) + suffix;
      const t0 = performance.now(), dur = 1300;
      (function step(t){
        const p = Math.min(1, (t-t0)/dur);
        node.textContent = fmt(num * (1-Math.pow(1-p,3)));
        if(p<1) requestAnimationFrame(step);
      })(t0);
    });
  }, {threshold:.5});
  els.forEach(el => io.observe(el));
})();

/* 打字机 —— 品牌名循环 */
(() => {
  const stage = document.getElementById('brText');
  if(!stage) return;
  const texts = ['天马一站式数据服务中心', 'TianmaDataLab'];
  const TYPE_MS = 90, DELETE_MS = 45, PAUSE_FULL = 1800, PAUSE_EMPTY = 400;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = 0, timer = 0;

  function setText(s){ stage.textContent = s; }

  function start(){
    clearTimeout(timer);
    if(reduce){ setText(texts[0]); return; }
    const text = texts[idx % texts.length];
    // type out
    let i = 0;
    setText('');
    function typeStep(){
      i++;
      setText(text.slice(0, i));
      if(i < text.length){ timer = setTimeout(typeStep, TYPE_MS); }
      else { timer = setTimeout(deleteStart, PAUSE_FULL); }
    }
    function deleteStart(){
      let j = text.length;
      function delStep(){
        j--;
        setText(text.slice(0, j));
        if(j > 0){ timer = setTimeout(delStep, DELETE_MS); }
        else { timer = setTimeout(next, PAUSE_EMPTY); }
      }
      delStep();
    }
    function next(){
      idx++;
      start();
    }
    timer = setTimeout(typeStep, 300);
  }
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(start); }
  else { start(); }
})();

// 注册 Service Worker：让「添加到主屏幕」的图标以独立窗口运行，并支持断网打开
  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
