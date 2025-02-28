import fs from "node:fs";
import path from "node:path";

const chemistryData = fs.readFileSync(path.resolve("chemistry.txt"), "utf-8");

// Example of the chemistry data:

// Module 1: Development of Practical Skills in Chemistry
// Module 2: Foundations in Chemistry
// Chapter 2: Atoms, Ions, and Compounds – 20 pages
// 2.1 Atomic structure and isotopes – 5 pages [1/10]
// 2.2 Relative mass – 3 pages [1/10]
// 2.3 Formulae and equations – 4 pages [1/10]
// Chapter 3: Amount of Substance – 18 pages
// 3.1 Amount of substance and the mole – 6 pages [1/10]
// 3.2 Determination of formulae – 6 pages [2/10]
// 3.3 Moles and volumes – 6 pages [1/10]
// 3.4 Reacting quantities – 6 pages [3/10]
// Chapter 4: Acids and Redox – 16 pages
// 4.1 Acids, bases, and neutralisation – 6 pages [5/10]
// 4.2 Acid-base titrations – 4 pages [6/10]
// 4.3 Redox – 4 pages [4/10]

const chemistryDataArray = chemistryData.split("\n");

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

const chemistryDataObject = {};
let currentModule = "";
let currentChapter = "";
chemistryDataArray.forEach((unparsedLine, _) => {
	const line = parseLine(unparsedLine);
	const lineType = getLineType(line);

	if (lineType === "module") {
		const moduleName = line.trim();
		currentModule = moduleName;
		if (!chemistryDataObject[moduleName]) {
			chemistryDataObject[moduleName] = {};
		}
	}

	if (lineType === "chapter") {
		const chapterName = line.trim().split(" - ")[0];
		currentChapter = chapterName;
		if (!chemistryDataObject[currentModule][chapterName]) {
			chemistryDataObject[currentModule][chapterName] = [];
		}
	}

	if (lineType === "subchapter") {
		// Name is anything before the first " - number pages"
		const subchapterName = new RegExp(/(.+) - \d+ pages/).exec(line)?.[1];
		const subchapterPages = Number(new RegExp(/(\d+) pages /).exec(line)?.[1]);
		const difficulty = new RegExp(/\[(\d)\/10\]/).exec(line);
		const subchapterDifficulty = difficulty ? Number(difficulty[1]) : 0;
		chemistryDataObject[currentModule][currentChapter].push({
			name: subchapterName,
			pages: subchapterPages,
			difficulty: subchapterDifficulty,
		});
	}
});

// Type of the chemistry data object parsed
type TChemistryData = {
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
const chemistryDataObjectParsed: TChemistryData = [];
Object.keys(chemistryDataObject).forEach((module, _) => {
	const moduleChapters = chemistryDataObject[module];
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

	chemistryDataObjectParsed.push({
		moduleName: module,
		totalPages: moduleTotalPages,
		averageDifficulty: total / moduleChaptersParsed.length,
		moduleChapters: moduleChaptersParsed,
	});
});

fs.writeFileSync(
	path.resolve("chemistry.json"),
	JSON.stringify(chemistryDataObject, null, 2),
);

fs.writeFileSync(
	path.resolve("chemistry_parsed.json"),
	JSON.stringify(chemistryDataObjectParsed, null, 2),
);

// Output all subchapters:
let chemistrySubchaptersCount = 0;
const chemistrySubchapters: string[] = [];
Object.keys(chemistryDataObject).forEach((module, _) => {
	Object.keys(chemistryDataObject[module]).forEach((chapter, _) => {
		chemistryDataObject[module][chapter].forEach((subchapter, _) => {
			chemistrySubchaptersCount++;
			chemistrySubchapters.push(subchapter.name);
			chemistrySubchapters.push(subchapter.pages.toString());
			chemistrySubchapters.push(subchapter.difficulty.toString());
			chemistrySubchapters.push("-");
		});
	});
});

const chemistryLines = chemistrySubchapters.join("\n");
fs.writeFileSync(path.resolve("chemistry_lines.txt"), chemistryLines);

const chemistryHtmlStyle = `
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

let chemistryHtmlTable = chemistryHtmlStyle;
// Output modules as h2 with the total pages and average difficulty, and chapters as h3 with the total pages and average difficulty, and subchapters as a table
chemistryDataObjectParsed.forEach((module, _) => {
	chemistryHtmlTable += `<h2>${module.moduleName} - ${module.totalPages} pages - ${module.averageDifficulty.toFixed(2)} average difficulty</h2>`;
	module.moduleChapters.forEach((chapter, _) => {
		chemistryHtmlTable += `<h3>${chapter.chapterName} - ${chapter.totalPages} pages - ${chapter.averageDifficulty.toFixed(2)} average difficulty</h3>`;
		chemistryHtmlTable += `
			<table>
				<tr>
					<th>Subchapter</th>
					<th>Pages</th>
					<th>Difficulty</th>
				</tr>
		`;
		chapter.subchapters.forEach((subchapter, _) => {
			chemistryHtmlTable += `
				<tr>
					<td>${subchapter.name}</td>
					<td>${subchapter.pages}</td>
					<td>${subchapter.difficulty}</td>
				</tr>
			`;
		});
		chemistryHtmlTable += "</table>";
	});
});

let chemistryHtmlTableSubchapters = chemistryHtmlStyle;
// Same as chemistryHtmlTable but only a table with all the subchapters, sorted by difficulty
chemistryHtmlTableSubchapters += `
	<table>
		<tr>
			<th>Subchapter</th>
			<th>Pages</th>
			<th onClick="sortTable(2)" style="cursor: pointer;"
			>Difficulty</th>
		</tr>
`;
chemistryDataObjectParsed.forEach((module, _) => {
	module.moduleChapters.forEach((chapter, _) => {
		chapter.subchapters.forEach((subchapter, _) => {
			chemistryHtmlTableSubchapters += `
				<tr>
					<td>${subchapter.name}</td>
					<td>${subchapter.pages}</td>
					<td>${subchapter.difficulty}</td>
				</tr>
			`;
		});
	});
});
chemistryHtmlTableSubchapters += "</table>";
chemistryHtmlTableSubchapters += `
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
	path.resolve("docs/chemistry_table_subchapters.html"),
	chemistryHtmlTableSubchapters,
);

fs.writeFileSync(path.resolve("docs/chemistry_table.html"), chemistryHtmlTable);

const indexHtml = `
	<!DOCTYPE html>
	<html>
		<head>
			<title>Index</title>
		</head>
		<body>
			<ul>
				<li><a href="biology_table.html">Biology Table</a></li>
				<li><a href="biology_table_subchapters.html">Biology Table Subchapters</a></li>
				<li><a href="chemistry_table.html">Chemistry Table</a></li>
				<li><a href="chemistry_table_subchapters.html">Chemistry Table Subchapters</a></li>
			</ul>
		</body>
	</html>
`;

fs.writeFileSync(path.resolve("docs/index.html"), indexHtml);
