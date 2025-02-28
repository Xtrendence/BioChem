import fs from "node:fs";
import path from "node:path";

const biologyData = fs.readFileSync(path.resolve("biology.txt"), "utf-8");

// Example of the biology data:

// Module 1: Development of practical skills in Biology - 4 pages
// Module 2: Foundations in Biology - 146 pages
// Chapter 2: Basic components of living systems - 38 pages
// 2.1 Microscopy - 7 pages - [1/10]
// 2.2 Magnification and calibration - 4 pages - [1/10]
// 2.3 More microscopy - 7 pages - [1/10]
// 2.4 Eukaryotic cell structure - 7 pages - [1/10]
// 2.5 The ultrastructure of plant cells - 2 pages - [2/10]
// 2.6 Prokaryotic and eukaryotic cells - 3 pages - [2/10]
// Chapter 3: Biological Molecules - 42 pages
// 3.1 Biological elements - 4 pages - [2/10]
// 3.2 Water - 2 pages - [2/10]
// 3.3 Carbohydrates - 5 pages - [2/10]

const biologyDataArray = biologyData.split("\n");

function getLineType(line: string) {
	if (line.startsWith("Module")) {
		return "module";
	}

	if (line.startsWith("Chapter")) {
		return "chapter";
	}

	return "subchapter";
}

function parseLine(line: string) {
	// Replace all "–" with "-"
	return line.replace("–", "-");
}

const biologyDataObject = {};
let currentModule = "";
let currentChapter = "";
biologyDataArray.forEach((unparsedLine, _) => {
	const line = parseLine(unparsedLine);
	const lineType = getLineType(line);

	if (lineType === "module") {
		const moduleName = line.trim();
		currentModule = moduleName;
		if (!biologyDataObject[moduleName]) {
			biologyDataObject[moduleName] = {};
		}
	}

	if (lineType === "chapter") {
		const chapterName = line.trim().split(" - ")[0];
		currentChapter = chapterName;
		if (!biologyDataObject[currentModule][chapterName]) {
			biologyDataObject[currentModule][chapterName] = [];
		}
	}

	if (lineType === "subchapter") {
		// Name is anything before the first " - number pages"
		const subchapterName = new RegExp(/(.+) - \d+ pages/).exec(line)?.[1];
		const subchapterPages = Number(new RegExp(/(\d+) pages /).exec(line)?.[1]);
		const difficulty = new RegExp(/\[(\d)\/10\]/).exec(line);
		const subchapterDifficulty = difficulty ? Number(difficulty[1]) : 0;
		biologyDataObject[currentModule][currentChapter].push({
			name: subchapterName,
			pages: subchapterPages,
			difficulty: subchapterDifficulty,
		});
	}
});

// Type of the biology data object parsed
type TBiologyData = {
	moduleName: string;
	totalPages: number;
	averageDifficulty: number;
	moduleChapters: Array<{
		chapterName: string;
		totalPages: number;
		averageDifficulty: number;
		subchapters: Array<{
			name: string;
			pages: number;
			difficulty: number;
		}>;
	}>;
}[];

// For each module, add the total pages, and average difficulty
const biologyDataObjectParsed: TBiologyData = [];
Object.keys(biologyDataObject).forEach((module, _) => {
	const moduleChapters = biologyDataObject[module];
	const moduleChaptersParsed: {
		chapterName: string;
		totalPages: number;
		averageDifficulty: number;
		subchapters: { name: string; pages: number; difficulty: number }[];
	}[] = [];
	let moduleTotalPages = 0;
	let moduleTotalDifficulty = 0;
	Object.keys(moduleChapters).forEach((chapter, _) => {
		const subchapters = moduleChapters[chapter];
		const subchaptersParsed: {
			name: string;
			pages: number;
			difficulty: number;
		}[] = [];
		let chapterTotalPages = 0;
		let chapterTotalDifficulty = 0;
		subchapters.forEach((subchapter, _) => {
			subchaptersParsed.push(subchapter);
			chapterTotalPages += subchapter.pages;
			chapterTotalDifficulty += subchapter.difficulty;
		});
		moduleTotalPages += chapterTotalPages;
		moduleTotalDifficulty += chapterTotalDifficulty;
		moduleChaptersParsed.push({
			chapterName: chapter,
			totalPages: chapterTotalPages,
			averageDifficulty: chapterTotalDifficulty / subchapters.length,
			subchapters: subchaptersParsed,
		});
	});

	const total = moduleChaptersParsed.reduce(
		(acc, chapter) => acc + chapter.averageDifficulty,
		0,
	);

	biologyDataObjectParsed.push({
		moduleName: module,
		totalPages: moduleTotalPages,
		averageDifficulty: total / moduleChaptersParsed.length,
		moduleChapters: moduleChaptersParsed,
	});
});

fs.writeFileSync(
	path.resolve("biology.json"),
	JSON.stringify(biologyDataObject, null, 2),
);

fs.writeFileSync(
	path.resolve("biology_parsed.json"),
	JSON.stringify(biologyDataObjectParsed, null, 2),
);

// Output all subchapters:
let biologySubchaptersCount = 0;
const biologySubchapters: string[] = [];
Object.keys(biologyDataObject).forEach((module, _) => {
	Object.keys(biologyDataObject[module]).forEach((chapter, _) => {
		biologyDataObject[module][chapter].forEach((subchapter, _) => {
			biologySubchaptersCount++;
			biologySubchapters.push(subchapter.name);
			biologySubchapters.push(subchapter.pages.toString());
			biologySubchapters.push(subchapter.difficulty.toString());
			biologySubchapters.push("-");
		});
	});
});

const biologyLines = biologySubchapters.join("\n");
fs.writeFileSync(path.resolve("biology_lines.txt"), biologyLines);

const biologyHtmlStyle = `
	<style>
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th, td {
			border: 1px solid black;
			padding: 8px;
			text-align: left;
		}
		th {
			background-color: #f2f2f2;
		}
	</style>
`;

let biologyHtmlTable = biologyHtmlStyle;
// Output modules as h2 with the total pages and average difficulty, and chapters as h3 with the total pages and average difficulty, and subchapters as a table
biologyDataObjectParsed.forEach((module, _) => {
	biologyHtmlTable += `<h2>${module.moduleName} - ${module.totalPages} pages - ${module.averageDifficulty.toFixed(2)} average difficulty</h2>`;
	module.moduleChapters.forEach((chapter, _) => {
		biologyHtmlTable += `<h3>${chapter.chapterName} - ${chapter.totalPages} pages - ${chapter.averageDifficulty.toFixed(2)} average difficulty</h3>`;
		biologyHtmlTable += `
			<table>
				<tr>
					<th>Subchapter</th>
					<th>Pages</th>
					<th>Difficulty</th>
				</tr>
		`;
		chapter.subchapters.forEach((subchapter, _) => {
			biologyHtmlTable += `
				<tr>
					<td>${subchapter.name}</td>
					<td>${subchapter.pages}</td>
					<td>${subchapter.difficulty}</td>
				</tr>
			`;
		});
		biologyHtmlTable += "</table>";
	});
});

let biologyHtmlTableSubchapters = biologyHtmlStyle;
// Same as biologyHtmlTable but only a table with all the subchapters, sorted by difficulty
biologyHtmlTableSubchapters += `
	<table>
		<tr>
			<th>Subchapter</th>
			<th>Pages</th>
			<th onClick="sortTable(2)" style="cursor: pointer;"
			>Difficulty</th>
		</tr>
`;
biologyDataObjectParsed.forEach((module, _) => {
	module.moduleChapters.forEach((chapter, _) => {
		chapter.subchapters.forEach((subchapter, _) => {
			biologyHtmlTableSubchapters += `
				<tr>
					<td>${subchapter.name}</td>
					<td>${subchapter.pages}</td>
					<td>${subchapter.difficulty}</td>
				</tr>
			`;
		});
	});
});
biologyHtmlTableSubchapters += "</table>";
biologyHtmlTableSubchapters += `
	<script>
		function sortTable(n) {
			var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
			table = document.querySelector("table");
			switching = true;
			dir = "asc";
			while (switching) {
				switching = false;
				rows = table.rows;
				for (i = 1; i < rows.length - 1; i++) {
					shouldSwitch = false;
					x = rows[i].getElementsByTagName("TD")[n];
					y = rows[i + 1].getElementsByTagName("TD")[n];
					if (dir == "asc") {
						if (Number(x.innerHTML) > Number(y.innerHTML)) {
							shouldSwitch = true;
							break;
						}
					} else if (dir == "desc") {
						if (Number(x.innerHTML) < Number(y.innerHTML)) {
							shouldSwitch = true;
							break;
						}
					}
				}
				if (shouldSwitch) {
					rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
					switching = true;
					switchcount++;
				} else {
					if (switchcount == 0 && dir == "asc") {
						dir = "desc";
						switching = true;
					}
				}
			}
		}
	</script>
`;

fs.writeFileSync(
	path.resolve("docs/biology_table_subchapters.html"),
	biologyHtmlTableSubchapters,
);

fs.writeFileSync(path.resolve("docs/biology_table.html"), biologyHtmlTable);
