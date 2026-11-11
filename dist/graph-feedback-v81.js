// UI states only. Numerical graph domains, samples and regressions remain unchanged.
const escape=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function measuredGraphState(rows,graph){
 if(graph.points.length)return 'ready';
 if(!rows.length)return 'empty';
 return graph.excludedModes===rows.length?'other-mode':'nonfinite';
}
export function renderGraphFeedback({host,graph,rows,measured,locale='vi-VN',selectedRow=-1,valid=true,format=String}){
 const document=host.ownerDocument,en=locale==='en-US';
 const recoveryFocus=!!document.activeElement?.closest?.('.graph-empty-state');
 let axes=document.querySelector('#graphAxisLabels'),caption=document.querySelector('#graphStateCaption');
 if(!axes){axes=document.createElement('div');axes.id='graphAxisLabels';axes.className='graph-axis-labels';host.before(axes);}
 if(!caption){caption=document.createElement('p');caption.id='graphStateCaption';caption.className='graph-state-caption';caption.setAttribute('role','status');caption.setAttribute('aria-live','polite');caption.setAttribute('aria-atomic','true');host.after(caption);}
 const labels=(en?'x axis: ':'Trục x: ')+graph.xLabel+'; '+(en?'y axis: ':'Trục y: ')+graph.yLabel;
 if(axes.textContent!==labels)axes.textContent=labels;
 host.setAttribute('aria-describedby','graphAxisLabels graphStateCaption');
 let index=(graph.pointRows||[]).indexOf(selectedRow);if(index<0&&graph.points.length===1)index=0;
 const selected=index>=0?graph.points[index]:null;
 const text=measured&&selected?(en?'Measurement ':'Lần ')+((graph.pointRows?.[index]??index)+1)+' — '+graph.xLabel+': '+format(selected[0])+'; '+graph.yLabel+': '+format(selected[1]):measured&&graph.points.length?(en?'Select a recorded point to inspect its values and units.':'Chọn một điểm đã ghi để xem giá trị và đơn vị.'):'';
 if(caption.textContent!==text)caption.textContent=text;caption.hidden=!text;
 const state=measured?measuredGraphState(rows,graph):'ready';host.dataset.state=state==='ready'?'ready':'empty';
 if(state==='ready'){host.setAttribute('aria-label',en?'Interactive graph':'Đồ thị tương tác');host.title=en?'Select a recorded point to inspect its values.':'Chọn một điểm đã ghi để xem giá trị.';return false;}
 const title=state==='empty'?(en?'No recorded points yet':'Chưa có điểm đo'):state==='other-mode'?(en?'No points for this mode':'Chưa có điểm cho chế độ này'):(en?'No valid pair of values':'Chưa có cặp số liệu hợp lệ');
 const detail=state==='empty'?(en?'Record a state to plot your measurements. The model graph is available from the graph type selector.':'Ghi một trạng thái để vẽ đồ thị từ số liệu của bạn. Có thể chọn Mô hình ở bộ chọn loại đồ thị.'):state==='other-mode'?(en?rows.length+' recorded rows use another mode or have no mode information. The original table is kept.':rows.length+' dòng đã ghi thuộc chế độ khác hoặc thiếu thông tin chế độ. Bảng gốc vẫn được giữ.'):(en?'The recorded rows do not contain finite numbers for both selected axes. Choose other axes or record another point; the original table is unchanged.':'Các dòng đã ghi chưa có giá trị số hợp lệ cho cả hai trục. Chọn lại trục hoặc ghi thêm điểm; bảng gốc không thay đổi.');
 const button=state==='empty'?(en?'Record the first point':'Ghi điểm đầu tiên'):(en?'Record the current point':'Ghi điểm hiện tại');
 const signature=JSON.stringify([state,locale,rows.length,valid]);
 if(host.dataset.feedback!==signature||!host.querySelector('.graph-empty-state')){
  host.innerHTML='<section class="graph-empty-state" role="status"><h3>'+escape(title)+'</h3><p>'+escape(detail)+'</p><button class="button secondary" data-action="record"'+(valid?'':' disabled')+'>'+escape(button)+'</button>'+(valid?'':'<small>'+(en?'Return to a valid model state before recording.':'Đưa mô hình về trạng thái hợp lệ trước khi ghi điểm.')+'</small>')+'</section>';
  host.dataset.feedback=signature;if(recoveryFocus)host.querySelector('button')?.focus?.({preventScroll:true});
 }
 host.setAttribute('aria-label',title);host.title=detail;host.quanhPlot=null;return true;
}
