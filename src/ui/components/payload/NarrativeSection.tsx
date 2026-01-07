interface Feature {
	icon?: string;
	title?: string;
	text?: string;
}

interface NarrativeBlockData {
	oldWayLabel?: string;
	oldWayHeading?: string;
	oldWayText?: string;
	oldWayText2?: string;
	quote?: string;
	newStandardLabel?: string;
	newStandardHeading?: string;
	features?: Feature[];
}

interface NarrativeSectionProps {
	data: NarrativeBlockData;
}

export function NarrativeSection({ data }: NarrativeSectionProps) {
	return (
		<section id="story" className="relative overflow-hidden bg-stone-100 py-24 md:py-32">
			<div className="container mx-auto px-4 md:px-8">
				<div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
					{/* Left: The Problem (Middlemen/Knockoffs) */}
					<div className="flex flex-col justify-center space-y-8">
						<span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
							{data.oldWayLabel || "The OLD Way"}
						</span>
						<h2
							className="font-serif text-4xl leading-tight text-gray-900 md:text-5xl"
							dangerouslySetInnerHTML={{
								__html:
									data.oldWayHeading
										?.replace(/Middlemen\./g, '<span class="text-gray-500 line-through">Middlemen.</span>')
										.replace(/Knockoffs\./g, '<span class="text-gray-500 line-through">Knockoffs.</span>') ||
									'Lost in <span class="text-gray-500 line-through">Middlemen.</span><br />Drowned in <span class="text-gray-500 line-through">Knockoffs.</span>',
							}}
						/>
						{data.oldWayText && (
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">{data.oldWayText}</p>
						)}
						{data.oldWayText2 && (
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">{data.oldWayText2}</p>
						)}
						{data.quote && (
							<div className="border-l-2 border-gray-200 pl-6">
								<p className="font-serif text-2xl italic text-gray-500">{data.quote}</p>
							</div>
						)}
					</div>

					{/* Right: The Solution (Empowerment) */}
					<div className="relative">
						<div className="absolute -left-6 -top-6 size-full rounded-2xl border border-terracotta/20 bg-transparent" />
						<div className="relative z-10 rounded-xl bg-white p-8 shadow-xl md:p-12">
							<span className="font-mono text-xs font-bold uppercase tracking-widest text-terracotta">
								{data.newStandardLabel || "The New Standard"}
							</span>
							<h3 className="mt-4 font-serif text-3xl text-gray-900">
								{data.newStandardHeading || "Direct Empowerment"}
							</h3>

							<div className="mt-8 space-y-8">
								{(data.features || []).map((feature, idx) => (
									<div key={idx} className="flex gap-4">
										<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											{feature.icon || "✓"}
										</div>
										<div>
											<h4 className="font-bold text-gray-900">{feature.title}</h4>
											<p className="mt-1 text-sm text-gray-600">{feature.text}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
