
function makeTasks(folder, prefix, count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Task ${i + 1}`,
    file: `${folder}/${prefix}${i + 1}.html`,
  }));
}

const weeks = [
  { number: 2.2, topic: "Week 2.2", tasks: makeTasks("week_2.2", "exercise ", 7) },
  { number: 3.1, topic: "Week 3.1", tasks: makeTasks("week_3.1", "practise ", 7) },
  { number: 3.2, topic: "Week 3.2", tasks: makeTasks("week_3.2", "exercise_", 7) },
  { number: 4.1, topic: "JavaScript DOM & Events", tasks: makeTasks("week 4.1", "exercise ", 4) },
  { number: 6, topic: "Random Joke Fetcher", tasks: makeTasks(" build joke app.", ) },
];

const weeksBox = document.getElementById("weeks");

function render() {
  weeksBox.innerHTML = "";

  const sorted = [...weeks].sort((a, b) => b.number - a.number);

  for (const week of sorted) {
    const details = document.createElement("details");
    details.className = "week";
    details.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = `Week ${week.number} <span>${week.topic}</span>`;
    details.appendChild(summary);

    const list = document.createElement("ul");
    list.className = "tasks";
    for (const task of week.tasks) {
      const item = document.createElement("li");
      item.innerHTML = `<a href="${encodeURI(task.file)}">${task.name}</a>`;
      list.appendChild(item);
    }
    details.appendChild(list);
    weeksBox.appendChild(details);
  }
}

render();
