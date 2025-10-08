import { useState } from 'react';

export default function HeatmapChart() {
	const [selectedYear, setSelectedYear] = useState(2024);
	const [hoveredCell, setHoveredCell] = useState(null);

	// Generate years from 2020 to current year
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let year = currentYear; year >= 2020; year--) {
		years.push(year);
	}

	// Generate 365 days of data for selected year
	const generateYearData = (year) => {
		const data = [];
		const startDate = new Date(year, 0, 1); // January 1st of the year

		// Determine if it's a leap year
		const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		const daysInYear = isLeapYear ? 366 : 365;

		for (let i = 0; i < daysInYear; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);
			data.push({
				date: date,
				value: Math.floor(Math.random() * 100),
				dateString: date.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
			});
		}
		return data;
	};

	const yearData = generateYearData(selectedYear);

	// Calculate total contributions
	const totalContributions = yearData.reduce((sum, day) => sum + day.value, 0);

	// Organize data into weeks
	const getWeeksData = () => {
		const weeks = [];
		let currentWeek = [];

		const firstDay = yearData[0].date.getDay();

		for (let i = 0; i < firstDay; i++) {
			currentWeek.push(null);
		}

		yearData.forEach((day) => {
			currentWeek.push(day);

			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
		});

		if (currentWeek.length > 0) {
			while (currentWeek.length < 7) {
				currentWeek.push(null);
			}
			weeks.push(currentWeek);
		}

		return weeks;
	};

	const weeks = getWeeksData();

	// Get month labels
	const getMonthLabels = () => {
		const labels = [];
		let lastMonth = -1;

		weeks.forEach((week, weekIdx) => {
			const firstDay = week.find((day) => day !== null);
			if (firstDay) {
				const month = firstDay.date.getMonth();
				if (month !== lastMonth && weekIdx % 4 === 0) {
					labels.push({
						index: weekIdx,
						label: firstDay.date.toLocaleDateString('en-US', { month: 'short' })
					});
					lastMonth = month;
				}
			}
		});

		return labels;
	};

	const monthLabels = getMonthLabels();

	const getColor = (value) => {
		if (value === 0) return 'bg-gray-100';
		if (value < 20) return 'bg-indigo-200';
		if (value < 40) return 'bg-indigo-300';
		if (value < 60) return 'bg-indigo-400';
		if (value < 80) return 'bg-indigo-500';
		return 'bg-indigo-600';
	};

	const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	return (
		<div className="mx-auto mb-8 max-w-7xl">
			<div className="overflow-hidden rounded-2xl bg-white shadow-lg">
				<div className="flex">
					{/* Sidebar */}
					<div className="w-48 border-r border-gray-200 bg-gray-50 p-6">
						<h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
							Years
						</h2>
						<div className="space-y-1">
							{years.map((year) => (
								<button
									key={year}
									onClick={() => setSelectedYear(year)}
									className={`w-full rounded-lg px-4 py-2 text-left transition-all duration-200 ${
										selectedYear === year
											? 'bg-indigo-600 text-white shadow-md'
											: 'text-gray-700 hover:bg-gray-200'
									}`}
								>
									{year}
								</button>
							))}
						</div>
					</div>

					{/* Main content */}
					<div className="flex-1 p-8">
						<div className="mb-6">
							<h1 className="mb-2 text-3xl font-bold text-gray-800">{selectedYear} Activity</h1>
							<p className="text-gray-600">
								{totalContributions.toLocaleString()} contributions in {selectedYear}
							</p>
						</div>

						{/* Only the heatmap grid and its labels are horizontally scrollable */}
						<div className="w-full">
							<div className="mb-2 flex">
								<div className="mr-2" style={{ width: '20px' }}></div>
								<div className="relative flex">
									{/* Month labels aligned to grid */}
									{(() => {
										const weekCount = weeks.length;
										const cellSize = 14; // px, matches h-3/w-3 + gap
										const monthSpans = [];
										let lastMonth = null;
										let startIdx = 0;
										for (let i = 0; i < weekCount; i++) {
											const week = weeks[i];
											const firstDay = week.find((d) => d !== null);
											const month = firstDay ? firstDay.date.getMonth() : null;
											if (month !== lastMonth && firstDay) {
												if (lastMonth !== null) {
													monthSpans.push({
														month: new Date(selectedYear, lastMonth, 1).toLocaleString('en-US', {
															month: 'short'
														}),
														start: startIdx,
														end: i
													});
													startIdx = i;
												}
												lastMonth = month;
											}
										}
										// Push last month
										if (lastMonth !== null) {
											monthSpans.push({
												month: new Date(selectedYear, lastMonth, 1).toLocaleString('en-US', {
													month: 'short'
												}),
												start: startIdx,
												end: weekCount
											});
										}
										return monthSpans.map((span, idx) => (
											<div
												key={idx}
												className="text-center text-xs font-medium text-gray-600"
												style={{
													width: `${(span.end - span.start) * cellSize + (span.end - span.start - 1)}px`,
													minWidth: '28px'
												}}
											>
												{span.month}
											</div>
										));
									})()}
								</div>
							</div>
							<div className="overflow-x-auto">
								<div className="inline-block min-w-fit">
									<div className="flex">
										{/* Day labels */}
										<div className="mr-2 flex flex-col justify-between py-1">
											{dayLabels.map((day, idx) => (
												<div
													key={idx}
													className="h-3 text-xs text-gray-600"
													style={{ lineHeight: '12px' }}
												>
													{idx % 2 === 1 ? day : ''}
												</div>
											))}
										</div>

										{/* Heatmap grid */}
										<div className="flex gap-1 p-1">
											{weeks.map((week, weekIdx) => (
												<div key={weekIdx} className="flex flex-col gap-1">
													{week.map((day, dayIdx) => (
														<div
															key={dayIdx}
															className={`h-3 w-3 rounded-sm transition-all duration-150 ${
																day
																	? `${getColor(day.value)} cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1`
																	: 'bg-transparent'
															}`}
															title={day ? `${day.dateString}: ${day.value} contributions` : ''}
														></div>
													))}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Tooltip */}
						{hoveredCell && (
							<div className="mt-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
								<p className="text-sm font-semibold text-gray-700">{hoveredCell.dateString}</p>
								<p className="mt-1 text-2xl font-bold text-green-600">
									{hoveredCell.value} contributions
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
