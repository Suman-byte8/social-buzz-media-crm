import React from 'react'

const page = () => {
  return (
    <div>
      <div className="px-container-margin py-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-secondary-container bg-surface flex-shrink-0 z-10 relative">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Content Calendar</h2>
          <p className="font-body-sm text-body-sm text-secondary mt-1">Manage and track social media pipeline.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Client Filter */}
          <div className="relative w-full sm:w-auto">
            <select className="w-full sm:w-[200px] appearance-none bg-surface border border-secondary-container text-body-sm rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-body-sm">
              <option>All Clients</option>
              <option>Acme Corp</option>
              <option>Globex Inc</option>
              <option>Initech</option>
              <option>Stark Industries</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>

          {/* View Toggle */}
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-secondary-container">
            <button className="px-4 py-1.5 rounded-md font-label-sm text-label-sm flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">calendar_view_month</span>
              Calendar
            </button>
            <button className="px-4 py-1.5 rounded-md font-label-sm text-label-sm flex items-center gap-2 bg-white shadow-sm text-primary font-bold border border-secondary-container/50">
              <span className="material-symbols-outlined text-[16px]">view_column</span>
              Kanban
            </button>
          </div>

          {/* New Post Action */}
          <button className="bg-primary text-white font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary-container transition-colors active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Post
          </button>
        </div>
      </div>

      {/* Kanban Board Canvas */}
      <div className="flex-1 overflow-hidden p-container-margin pb-8">
        <div className="grid gap-gutter grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-start justify-center max-w-full">
          {/* Column: Idea */}
          <div className="w-full flex flex-col h-full bg-surface-container-lowest/50 rounded-xl column-border p-3">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Idea</h3>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">2</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 h-full">
              {/* Card 1 */}
              <div className="bg-white rounded-lg p-4 card-shadow border border-secondary-fixed hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">campaign</span>
                    <span className="font-label-sm text-label-sm text-secondary">Acme Corp</span>
                  </div>
                  <span className="bg-surface-container-low text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-xl">Idea</span>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2 leading-tight">Q3 Product Launch Teaser</h4>
                <div className="h-24 w-full bg-surface-container rounded-md mb-3 overflow-hidden">
                  <div
                    className="bg-cover bg-center w-full h-full opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                    data-alt="A sleek, modern graphic design mockup of a smartphone displaying a conceptual 3D product teaser with abstract geometric shapes and vibrant red accents on a crisp white background."
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6Gh22TgcTTh6UNKsdY6szODa2nrYFf14V_t4118T8lwWoRvdbvRzpolcHkxUDB2-5A5v95rypwko0fbSXtkjz9Jpzh5TXCzzFOG9wA360QkodfoF9MXwApMOwrTIckqU63aAxECZliSt67HT-6oBPPSEQuvHLMUqnmN0R0DAAky2bl_2WLoWBqgKmskEFbl9nmBc7fGd8m-7NiuJwTnMJ8AKrW7mLkE1O572HFzf8feU_SlML5UbG')",
                    }}
                  ></div>
                </div>
                <div className="flex justify-between items-center border-t border-secondary-container pt-3 mt-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white">
                      <img
                        alt="Assignee"
                        className="w-full h-full object-cover"
                        data-alt="A tiny avatar portrait of a creative director."
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCobRjaYmkifLkOGxfidxUi_lJUzzLWQCU8nJPm8j6GLRf-OIIBiSG82JAEzQMcCWibWJu_TrVbvjCYUU0UbRwyW7BODUrF3D2ek2BlVRw5w616P76OjdK3vzg2WKkIoFUGyKyjsKuQAQT-3JUwJ8KPmUDSVC_SwZfk7-LaxSPlrt74x5fD1SU2vYJkK03X1fmKwTw4FL09IErwH-iY4IaFZZsOOF9U7WDu-BdQqWhg73qUhLcx96rz"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column: Writing */}
          <div className="w-full flex flex-col h-full bg-surface-container-lowest/50 rounded-xl column-border p-3">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Writing</h3>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 h-full">
              {/* Card 2 */}
              <div className="bg-white rounded-lg p-4 card-shadow border border-secondary-fixed hover:border-primary/50 transition-colors cursor-grab">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">forum</span>
                    <span className="font-label-sm text-label-sm text-secondary">Initech</span>
                  </div>
                  <span className="bg-[#e3f2fd] text-blue-700 font-label-sm text-label-sm px-2 py-0.5 rounded-xl">Writing</span>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2 leading-tight">Thread: Office Culture Myths</h4>
                <p className="text-body-sm font-body-sm text-secondary line-clamp-2 mb-3">
                  Drafting a 5-part thread debunking common myths about modern office culture and hybrid work environments...
                </p>
                <div className="flex justify-between items-center border-t border-secondary-container pt-3 mt-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-primary text-white flex items-center justify-center font-label-sm text-label-sm">
                      JS
                    </div>
                  </div>
                  <div className="text-xs text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Oct 12
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column: Design */}
          <div className="w-full flex flex-col h-full bg-surface-container-lowest/50 rounded-xl column-border p-3">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Design</h3>
              <span className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">0</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 h-full flex-1 justify-center items-center opacity-50">
              <span className="material-symbols-outlined text-4xl text-secondary-fixed-dim mb-2">palette</span>
              <p className="font-body-sm text-body-sm text-secondary text-center">No tasks in design currently.</p>
              <button className="mt-2 text-primary font-label-md text-label-md hover:underline">Create Task</button>
            </div>
          </div>

          {/* Column: Client Review */}
          <div className="w-full flex flex-col h-full bg-surface-container-lowest/50 rounded-xl column-border p-3">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Client Review</h3>
              <span className="bg-error-container text-on-error-container font-label-sm text-label-sm px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 h-full">
              {/* Card 3 */}
              <div className="bg-white rounded-lg p-4 card-shadow border-l-4 border-l-error border-y border-r border-secondary-fixed hover:border-r-primary/50 transition-colors cursor-grab relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <button className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 border border-green-200 transition-colors" title="Approve">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </button>
                  <button className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 border border-red-200 transition-colors" title="Reject">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
                <div className="flex justify-between items-start mb-2 pr-14">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-pink-600 text-[18px]">photo_camera</span>
                    <span className="font-label-sm text-label-sm text-secondary">Globex Inc</span>
                  </div>
                </div>
                <h4 className="font-title-lg text-title-lg text-on-surface mb-2 leading-tight">Behind the Scenes Reel</h4>
                <div className="h-32 w-full bg-surface-container rounded-md mb-3 overflow-hidden relative">
                  <div
                    className="bg-cover bg-center w-full h-full"
                    data-alt="A still frame from an energetic behind-the-scenes video showing a modern production crew setting up lights in a sleek corporate office, bright lighting, high contrast."
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATnJLikYwgdeLveKWKnJ_Z-ElR-N03RmPwohHROJbVC6Y8Wua_tqFbB73VdnzLHi-oaPucVJvHnETdBlApA4ieHy8Qi-AS-V9srBVuVWIymBc8UiSBspUf9JpjCsyX5Nqb1fCNwMVtKV0JwbOW-3TEL9Ep7H_xJL5438ZJlJTTAaWeJIaYfrZVxyhqig1HeQB-Tsckpw3feUh01h4QeSG70LKUrDMF0NITANWP-RBwsbmt0-hhG52B')",
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="material-symbols-outlined text-white text-3xl opacity-80">play_circle</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-secondary-container pt-3 mt-2">
                  <span className="bg-error-container/50 text-error font-label-sm text-label-sm px-2 py-0.5 rounded-xl flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    Pending
                  </span>
                  <div className="text-xs text-error font-bold flex items-center gap-1">Due Today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
