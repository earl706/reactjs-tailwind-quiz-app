import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import HeatmapChart from './components/HeatmapChart';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	Upload,
	Trophy,
	Clock,
	ArrowLeft,
	BookOpen,
	Target,
	Calendar
} from 'lucide-react';
import sampleQuizzesData from './quizzes/sampleQuiz.json';
import Latex from 'react-latex-next';

// Utility: Fisher-Yates shuffle
function shuffleArray(array) {
	const arr = array.slice();
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

// IdentificationFlashcard component
const normalize = (str) => (str || '').trim().toLowerCase().replace(/\s+/g, ' ');

const IdentificationFlashcard = ({
	question,
	onSubmit,
	showFeedback,
	correctAnswer,
	userAnswer,
	setUserAnswer,
	disabled,
	isMath = true
}) => {
	const [localAnswer, setLocalAnswer] = useState(userAnswer || '');

	useEffect(() => {
		setLocalAnswer(userAnswer || '');
	}, [userAnswer, question]);

	const isCorrect = normalize(localAnswer) === normalize(correctAnswer);

	return (
		<div>
			<h2 className="mb-8 text-2xl font-bold text-gray-800">{question.question}</h2>
			<div className="mb-8">
				<textarea
					className="w-full rounded-lg border-2 border-gray-200 p-4 font-mono text-lg focus:border-indigo-500 focus:outline-none"
					placeholder={isMath ? 'Type your answer in LaTeX' : 'Type your answer...'}
					value={localAnswer}
					onChange={(e) => {
						setLocalAnswer(e.target.value);
						setUserAnswer(e.target.value);
					}}
					disabled={showFeedback || disabled}
					autoFocus
					rows={3}
				/>
				<div className="mt-4">
					<p className="mb-1 text-sm text-gray-500">Preview:</p>
					<div className="min-h-[2.5rem] rounded border border-gray-200 bg-gray-50 px-3 py-2">
						{isMath ? <Latex>{`$ \\ ${localAnswer} $`}</Latex> : <span>{localAnswer}</span>}
					</div>
				</div>
			</div>
			{showFeedback && (
				<div
					className={`mb-6 rounded-lg p-4 ${
						isCorrect ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'
					}`}
				>
					<div className="flex items-start gap-3">
						{isCorrect ? (
							<CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
						) : (
							<XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
						)}
						<div>
							<p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
								{isCorrect ? 'Correct!' : 'Incorrect!'}
							</p>
							{!isCorrect && (
								<p className="mt-1 text-sm text-gray-700">
									The correct answer is:{' '}
									<span className="font-semibold">
										{isMath ? <Latex>{`$${correctAnswer}$`}</Latex> : <span>{correctAnswer}</span>}
									</span>
								</p>
							)}
						</div>
					</div>
				</div>
			)}
			<div className="flex gap-4">
				{!showFeedback ? (
					<button
						onClick={onSubmit}
						disabled={localAnswer.trim() === ''}
						className="w-full cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						Submit Answer
					</button>
				) : null}
			</div>
		</div>
	);
};

const MultipleChoiceFlashcard = ({
	question,
	selectedAnswer,
	onSelect,
	showFeedback,
	onSubmit,
	onNext,
	isLastQuestion,
	isCorrect,
	disabled
}) => {
	return (
		<>
			<h2 className="mb-8 text-2xl font-bold text-gray-800">{question.question}</h2>
			<div className="mb-8 space-y-3">
				{question.choices.map((choice, idx) => {
					let buttonClass =
						'cursor-pointer w-full text-left p-4 rounded-lg border-2 transition-all ';

					if (showFeedback) {
						if (choice === question.correct_answer) {
							buttonClass += 'border-green-500 bg-green-50 text-green-800';
						} else if (choice === selectedAnswer) {
							buttonClass += 'border-red-500 bg-red-50 text-red-800';
						} else {
							buttonClass += 'border-gray-200 bg-gray-50 text-gray-500';
						}
					} else {
						if (selectedAnswer === choice) {
							buttonClass += 'border-indigo-500 bg-indigo-50 text-indigo-800';
						} else {
							buttonClass += 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50';
						}
					}

					return (
						<button
							key={idx}
							onClick={() => onSelect(choice)}
							disabled={showFeedback || disabled}
							className={buttonClass}
						>
							<div className="flex items-center justify-between">
								<span>{choice}</span>
								{showFeedback && choice === question.correct_answer && (
									<CheckCircle className="h-6 w-6 text-green-500" />
								)}
								{showFeedback &&
									choice === selectedAnswer &&
									choice !== question.correct_answer && (
										<XCircle className="h-6 w-6 text-red-500" />
									)}
							</div>
						</button>
					);
				})}
			</div>
			<div className="flex gap-4">
				{!showFeedback ? (
					<button
						onClick={onSubmit}
						disabled={selectedAnswer === null}
						className="w-full cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						Submit Answer
					</button>
				) : (
					<button
						onClick={onNext}
						className="w-full cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700"
					>
						{isLastQuestion ? 'Finish Quiz' : 'Next Question'}
					</button>
				)}
			</div>
		</>
	);
};

// --- Logic hooks and helpers ---
function useFlashcardQuizLogic() {
	const [view, setView] = useState('landing');
	const [quizzes, setQuizzes] = useState([]);
	const [selectedQuiz, setSelectedQuiz] = useState(null);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [score, setScore] = useState(0);
	const [quizComplete, setQuizComplete] = useState(false);
	const [allResults, setAllResults] = useState({});
	const [startTime, setStartTime] = useState(null);

	const [randomizeQuestions, setRandomizeQuestions] = useState(true);
	const [randomizeChoices, setRandomizeChoices] = useState(true);
	const [randomizedQuiz, setRandomizedQuiz] = useState(null);

	const [quizVariant, setQuizVariant] = useState('multiple-choice');

	useEffect(() => {
		setQuizzes(sampleQuizzesData.quizzes);
		const storedResults = {};
		setAllResults(storedResults);
	}, []);

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					const data = JSON.parse(event.target.result);
					if (data.quizzes && Array.isArray(data.quizzes)) {
						setQuizzes(data.quizzes);
					} else {
						alert('Invalid format. Expected { "quizzes": [...] }');
					}
				} catch (error) {
					alert('Invalid JSON file. Please check the format.');
				}
			};
			reader.readAsText(file);
		}
	};

	const getRandomizedQuiz = (quiz, randomizeQuestions, randomizeChoices) => {
		let questions = quiz.questions.slice();
		if (randomizeQuestions) {
			questions = shuffleArray(questions);
		}
		if (randomizeChoices) {
			questions = questions.map((q) => ({
				...q,
				choices: shuffleArray(q.choices)
			}));
		}
		return { ...quiz, questions };
	};

	const startQuiz = (quiz, variant = quizVariant) => {
		const randomized = getRandomizedQuiz(quiz, randomizeQuestions, randomizeChoices);
		setSelectedQuiz(quiz);
		setRandomizedQuiz(randomized);
		setView('quiz');
		setCurrentQuestion(0);
		setScore(0);
		setQuizComplete(false);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setStartTime(Date.now());
		setQuizVariant(variant);
	};

	const handleAnswerSelect = (choice) => {
		if (showFeedback) return;
		setSelectedAnswer(choice);
	};

	const handleSubmitAnswer = () => {
		if (selectedAnswer === null || selectedAnswer === undefined) return;

		setShowFeedback(true);

		const currentQ = randomizedQuiz.questions[currentQuestion];
		let isCorrect = false;
		if (quizVariant === 'multiple-choice') {
			isCorrect = selectedAnswer === currentQ.correct_answer;
		} else if (quizVariant === 'identification') {
			isCorrect =
				(selectedAnswer || '').trim().toLowerCase() ===
				(currentQ.correct_answer || '').trim().toLowerCase();
		}
		if (isCorrect) {
			setScore((prev) => prev + 1);
		}
	};

	const handleNextQuestion = () => {
		if (currentQuestion < randomizedQuiz.questions.length - 1) {
			setCurrentQuestion(currentQuestion + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			finishQuiz();
		}
	};

	const finishQuiz = () => {
		const timeTaken = Math.floor((Date.now() - startTime) / 1000);
		const accuracy = ((score / randomizedQuiz.questions.length) * 100).toFixed(1);

		const newAttempt = {
			date: new Date().toLocaleString(),
			score: score,
			total: randomizedQuiz.questions.length,
			accuracy: accuracy,
			timeTaken: timeTaken,
			randomizeQuestions,
			randomizeChoices,
			variant: quizVariant
		};

		const updatedResults = { ...allResults };
		if (!updatedResults[selectedQuiz.id]) {
			updatedResults[selectedQuiz.id] = [];
		}
		updatedResults[selectedQuiz.id] = [newAttempt, ...updatedResults[selectedQuiz.id]];
		setAllResults(updatedResults);

		setQuizComplete(true);

		const results = {
			quizId: selectedQuiz.id,
			quizTitle: selectedQuiz.title,
			attempts: updatedResults[selectedQuiz.id]
		};

		if (window.showSaveFilePicker) {
			(async () => {
				try {
					const options = {
						suggestedName: `${selectedQuiz.id}_results_${Date.now()}.json`,
						types: [
							{
								description: 'JSON Files',
								accept: { 'application/json': ['.json'] }
							}
						]
					};
					const handle = await window.showSaveFilePicker(options);
					const writable = await handle.createWritable();
					await writable.write(JSON.stringify(results, null, 2));
					await writable.close();
				} catch (err) {
					const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = `${selectedQuiz.id}_results_${Date.now()}.json`;
					link.click();
					URL.revokeObjectURL(url);
				}
			})();
		} else {
			const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${selectedQuiz.id}_results_${Date.now()}.json`;
			link.click();
			URL.revokeObjectURL(url);
		}
	};

	const generateResultsFile = (quizId, attempts) => {
		const results = {
			quizId: quizId,
			quizTitle: selectedQuiz.title,
			attempts: attempts
		};

		const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${quizId}_results_${Date.now()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const restartQuiz = () => {
		const randomized = getRandomizedQuiz(selectedQuiz, randomizeQuestions, randomizeChoices);
		setRandomizedQuiz(randomized);
		setCurrentQuestion(0);
		setScore(0);
		setQuizComplete(false);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setStartTime(Date.now());
	};

	const backToLanding = () => {
		setView('landing');
		setSelectedQuiz(null);
		setRandomizedQuiz(null);
		setQuizComplete(false);
	};

	const getDifficultyColor = (difficulty) => {
		switch (difficulty?.toLowerCase()) {
			case 'easy':
				return 'bg-green-100 text-green-800';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800';
			case 'hard':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getQuizStats = (quizId) => {
		const attempts = allResults[quizId] || [];
		if (attempts.length === 0) return null;

		const avgScore = (
			attempts.reduce((sum, a) => sum + parseFloat(a.accuracy), 0) / attempts.length
		).toFixed(1);
		const bestScore = Math.max(...attempts.map((a) => parseFloat(a.accuracy)));

		return { attempts: attempts.length, avgScore, bestScore };
	};

	return {
		view,
		setView,
		quizzes,
		setQuizzes,
		selectedQuiz,
		setSelectedQuiz,
		currentQuestion,
		setCurrentQuestion,
		selectedAnswer,
		setSelectedAnswer,
		showFeedback,
		setShowFeedback,
		score,
		setScore,
		quizComplete,
		setQuizComplete,
		allResults,
		setAllResults,
		startTime,
		setStartTime,
		randomizeQuestions,
		setRandomizeQuestions,
		randomizeChoices,
		setRandomizeChoices,
		randomizedQuiz,
		setRandomizedQuiz,
		quizVariant,
		setQuizVariant,
		handleFileUpload,
		getRandomizedQuiz,
		startQuiz,
		handleAnswerSelect,
		handleSubmitAnswer,
		handleNextQuestion,
		finishQuiz,
		generateResultsFile,
		restartQuiz,
		backToLanding,
		getDifficultyColor,
		getQuizStats
	};
}

// --- UI Components ---

function LandingHeader({ handleFileUpload }) {
	return (
		<div className="mb-12 text-center">
			<h1 className="mb-4 text-5xl font-bold text-gray-900">Quiz Hub</h1>
			<p className="mb-6 text-xl text-gray-600">
				Challenge yourself with our collection of quizzes
			</p>
			<div className="flex justify-center">
				<label className="flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700">
					<Upload className="h-5 w-5" />
					Upload Custom Quizzes
					<input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
				</label>
			</div>
		</div>
	);
}

function RandomizationOptions({
	randomizeQuestions,
	setRandomizeQuestions,
	randomizeChoices,
	setRandomizeChoices,
	quizVariant,
	setQuizVariant
}) {
	return (
		<div className="mb-8 flex flex-col items-center gap-4">
			<div className="flex items-center gap-4">
				<label className="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={randomizeQuestions}
						onChange={() => setRandomizeQuestions((v) => !v)}
						className="h-4 w-4 accent-indigo-600"
					/>
					<span className="text-sm text-gray-700">Randomize Questions Order</span>
				</label>
				<label className="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={randomizeChoices}
						onChange={() => setRandomizeChoices((v) => !v)}
						className="h-4 w-4 accent-indigo-600"
					/>
					<span className="text-sm text-gray-700">Randomize Choices Order</span>
				</label>
			</div>
			<div className="flex items-center gap-4">
				<label className="flex cursor-pointer items-center gap-2">
					<input
						type="radio"
						name="variant"
						value="multiple-choice"
						checked={quizVariant === 'multiple-choice'}
						onChange={() => setQuizVariant('multiple-choice')}
						className="h-4 w-4 accent-indigo-600"
					/>
					<span className="text-sm text-gray-700">Multiple Choice</span>
				</label>
				<label className="flex cursor-pointer items-center gap-2">
					<input
						type="radio"
						name="variant"
						value="identification"
						checked={quizVariant === 'identification'}
						onChange={() => setQuizVariant('identification')}
						className="h-4 w-4 accent-indigo-600"
					/>
					<span className="text-sm text-gray-700">Identification</span>
				</label>
			</div>
		</div>
	);
}

function QuizCard({ quiz, stats, allResults, getDifficultyColor, startQuiz }) {
	return (
		<div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
			<div className="flex flex-1 flex-col p-6">
				<div className="mb-3 flex items-start justify-between">
					<div className="flex-1">
						<h3 className="mb-2 text-xl font-bold text-gray-900">{quiz.title}</h3>
						<p className="mb-3 text-sm text-gray-600">{quiz.description}</p>
					</div>
					<BookOpen className="h-8 w-8 flex-shrink-0 text-indigo-500" />
				</div>

				<div className="mb-4 flex gap-2">
					<span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-800">
						{quiz.category}
					</span>
					<span className={`rounded-full px-3 py-1 text-xs ${getDifficultyColor(quiz.difficulty)}`}>
						{quiz.difficulty}
					</span>
				</div>

				<div className="mb-4 flex items-center text-sm text-gray-500">
					<Target className="mr-1 h-4 w-4" />
					{quiz.questions.length} Questions
				</div>

				{stats && (
					<div className="mb-4 rounded-lg bg-gray-50 p-3">
						<p className="mb-2 text-xs font-semibold text-gray-700">Your Stats</p>
						<div className="grid grid-cols-3 gap-2 text-center">
							<div>
								<p className="text-xs text-gray-500">Attempts</p>
								<p className="text-sm font-bold text-gray-900">{stats.attempts}</p>
							</div>
							<div>
								<p className="text-xs text-gray-500">Avg</p>
								<p className="text-sm font-bold text-blue-600">{stats.avgScore}%</p>
							</div>
							<div>
								<p className="text-xs text-gray-500">Best</p>
								<p className="text-sm font-bold text-green-600">{stats.bestScore}%</p>
							</div>
						</div>
					</div>
				)}

				{allResults[quiz.id] && allResults[quiz.id].length > 0 && (
					<div className="mb-4">
						<p className="mb-2 flex items-center text-xs font-semibold text-gray-700">
							<Calendar className="mr-1 h-3 w-3" />
							Recent Attempts
						</p>
						<div className="max-h-32 space-y-1 overflow-y-auto">
							{allResults[quiz.id].slice(0, 5).map((attempt, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between rounded bg-gray-50 p-2 text-xs"
								>
									<span className="truncate text-gray-500">{attempt.date}</span>
									<div className="flex flex-shrink-0 gap-2">
										<span className="font-semibold">
											{attempt.score}/{attempt.total}
										</span>
										<span className="text-green-600">{attempt.accuracy}%</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="mt-auto flex flex-col gap-2">
					<button
						onClick={() => startQuiz(quiz, 'multiple-choice')}
						className="w-full cursor-pointer rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
					>
						Start Multiple Choice
					</button>
					<button
						onClick={() => startQuiz(quiz, 'identification')}
						className="w-full cursor-pointer rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700"
					>
						Start Identification
					</button>
				</div>
			</div>
		</div>
	);
}

function QuizGrid({ quizzes, getQuizStats, allResults, getDifficultyColor, startQuiz }) {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{quizzes.map((quiz) => {
				const stats = getQuizStats(quiz.id);
				return (
					<QuizCard
						key={quiz.id}
						quiz={quiz}
						stats={stats}
						allResults={allResults}
						getDifficultyColor={getDifficultyColor}
						startQuiz={startQuiz}
					/>
				);
			})}
		</div>
	);
}

function NoQuizzesMessage() {
	return (
		<div className="py-12 text-center">
			<BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
			<p className="text-lg text-gray-600">
				No quizzes available. Upload a quizzes.json file to get started!
			</p>
		</div>
	);
}

function QuizCompleteStats({ score, total, accuracy, timeTaken }) {
	return (
		<div className="mb-8 grid grid-cols-3 gap-4">
			<div className="rounded-lg bg-blue-50 p-4 text-center">
				<p className="mb-1 text-sm text-gray-600">Score</p>
				<p className="text-2xl font-bold text-blue-600">
					{score}/{total}
				</p>
			</div>
			<div className="rounded-lg bg-green-50 p-4 text-center">
				<p className="mb-1 text-sm text-gray-600">Accuracy</p>
				<p className="text-2xl font-bold text-green-600">{accuracy}%</p>
			</div>
			<div className="rounded-lg bg-purple-50 p-4 text-center">
				<p className="mb-1 text-sm text-gray-600">Time</p>
				<p className="text-2xl font-bold text-purple-600">{timeTaken}s</p>
			</div>
		</div>
	);
}

function PreviousAttemptsList({ attempts }) {
	return (
		<div className="mb-8">
			<h3 className="mb-4 text-xl font-semibold text-gray-800">Previous Attempts</h3>
			<div className="max-h-48 overflow-y-auto rounded-lg bg-gray-50 p-4">
				{attempts.map((attempt, idx) => (
					<div
						key={idx}
						className="flex items-center justify-between border-b border-gray-200 py-2 last:border-0"
					>
						<span className="text-sm text-gray-600">{attempt.date}</span>
						<div className="flex gap-4 text-sm">
							<span className="font-semibold">
								{attempt.score}/{attempt.total}
							</span>
							<span className="text-green-600">{attempt.accuracy}%</span>
							<span className="text-gray-500">{attempt.timeTaken}s</span>
							{(attempt.randomizeQuestions || attempt.randomizeChoices) && (
								<span className="ml-2 text-xs text-indigo-500">
									{attempt.randomizeQuestions && 'Q'}
									{attempt.randomizeChoices && 'C'}
								</span>
							)}
							{attempt.variant && (
								<span className="ml-2 text-xs text-purple-500">
									{attempt.variant === 'identification' ? 'ID' : 'MC'}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function QuizProgressBar({ current, total }) {
	return (
		<div className="mb-8 h-2 w-full rounded-full bg-gray-200">
			<div
				className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
				style={{ width: `${((current + 1) / total) * 100}%` }}
			></div>
		</div>
	);
}

// --- Main Component ---

const FlashcardQuiz = () => {
	const logic = useFlashcardQuizLogic();

	// Landing Page View
	if (logic.view === 'landing') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
				<div className="mx-auto max-w-7xl px-4 py-12">
					<LandingHeader handleFileUpload={logic.handleFileUpload} />
					<HeatmapChart />
					<RandomizationOptions
						randomizeQuestions={logic.randomizeQuestions}
						setRandomizeQuestions={logic.setRandomizeQuestions}
						randomizeChoices={logic.randomizeChoices}
						setRandomizeChoices={logic.setRandomizeChoices}
						quizVariant={logic.quizVariant}
						setQuizVariant={logic.setQuizVariant}
					/>
					<QuizGrid
						quizzes={logic.quizzes}
						getQuizStats={logic.getQuizStats}
						allResults={logic.allResults}
						getDifficultyColor={logic.getDifficultyColor}
						startQuiz={logic.startQuiz}
					/>
					{logic.quizzes.length === 0 && <NoQuizzesMessage />}
				</div>
			</div>
		);
	}

	// Quiz Complete View
	if (logic.quizComplete) {
		const accuracy = ((logic.score / logic.randomizedQuiz.questions.length) * 100).toFixed(1);
		const timeTaken = Math.floor((Date.now() - logic.startTime) / 1000);
		const attempts = logic.allResults[logic.selectedQuiz.id] || [];

		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
				<div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
					<button
						onClick={logic.backToLanding}
						className="mb-6 flex items-center text-gray-600 transition hover:text-gray-900"
					>
						<ArrowLeft className="mr-2 h-5 w-5" />
						Back to Quizzes
					</button>

					<div className="mb-8 text-center">
						<Trophy className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
						<h2 className="mb-2 text-3xl font-bold text-gray-800">Quiz Complete!</h2>
						<p className="text-gray-600">{logic.selectedQuiz.title}</p>
					</div>

					<QuizCompleteStats
						score={logic.score}
						total={logic.randomizedQuiz.questions.length}
						accuracy={accuracy}
						timeTaken={timeTaken}
					/>

					{attempts.length > 0 && <PreviousAttemptsList attempts={attempts} />}

					<div className="flex gap-4">
						<button
							onClick={logic.restartQuiz}
							className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700"
						>
							<RotateCcw className="h-5 w-5" />
							Retake Quiz
						</button>
						<button
							onClick={logic.backToLanding}
							className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-gray-800 transition hover:bg-gray-300"
						>
							<ArrowLeft className="h-5 w-5" />
							All Quizzes
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Quiz View
	if (!logic.randomizedQuiz) return null;

	const currentQ = logic.randomizedQuiz.questions[logic.currentQuestion];
	const isCorrect =
		logic.quizVariant === 'multiple-choice'
			? logic.selectedAnswer === currentQ.correct_answer
			: (logic.selectedAnswer || '').trim().toLowerCase() ===
				(currentQ.correct_answer || '').trim().toLowerCase();

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
				<button
					onClick={logic.backToLanding}
					className="mb-6 flex items-center text-gray-600 transition hover:text-gray-900"
				>
					<ArrowLeft className="mr-2 h-5 w-5" />
					Back to Quizzes
				</button>

				<div className="mb-6 flex items-center justify-between">
					<div className="text-sm text-gray-600">
						Question {logic.currentQuestion + 1} of {logic.randomizedQuiz.questions.length}
					</div>
					<div className="text-sm font-semibold text-indigo-600">
						Score: {logic.score}/{logic.randomizedQuiz.questions.length}
					</div>
				</div>

				<QuizProgressBar
					current={logic.currentQuestion}
					total={logic.randomizedQuiz.questions.length}
				/>

				{logic.quizVariant === 'multiple-choice' ? (
					<MultipleChoiceFlashcard
						question={currentQ}
						selectedAnswer={logic.selectedAnswer}
						onSelect={logic.handleAnswerSelect}
						showFeedback={logic.showFeedback}
						onSubmit={logic.handleSubmitAnswer}
						onNext={logic.handleNextQuestion}
						isLastQuestion={logic.currentQuestion >= logic.randomizedQuiz.questions.length - 1}
						isCorrect={isCorrect}
						disabled={logic.showFeedback}
					/>
				) : (
					<>
						<IdentificationFlashcard
							question={currentQ}
							onSubmit={logic.handleSubmitAnswer}
							showFeedback={logic.showFeedback}
							correctAnswer={currentQ.correct_answer}
							userAnswer={logic.selectedAnswer}
							setUserAnswer={logic.setSelectedAnswer}
							disabled={logic.showFeedback}
						/>
						{logic.showFeedback && (
							<div className="mt-4 flex gap-4">
								<button
									onClick={logic.handleNextQuestion}
									className="w-full cursor-pointer rounded-lg bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700"
								>
									{logic.currentQuestion < logic.randomizedQuiz.questions.length - 1
										? 'Next Question'
										: 'Finish Quiz'}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default FlashcardQuiz;
