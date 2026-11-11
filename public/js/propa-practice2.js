// ProPa Practice tasks and Cheat sheet entries for the Reussner part. The tasks join PROPA_DRILLS
// (propa-practice.js) with part "Reussner"; several reuse the chapters' engines (the C declaration
// decoder, the MPI simulator) so answers always match the drawings.

const ppR = (d) => PROPA_DRILLS.push({ part: "Reussner", ...d });
const fx = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toString();

ppR({
  id: "amdahl", ch: 5, name: "Amdahl's law", about: "speedup and its limit",
  make() {
    if (Math.random() < 0.4) {
      const rf = pick([0.8, 0.9, 0.75]), tr = rint(1, 3), tw = rint(2, 5), n = pick([2, 4, 8]);
      const p = (tr * rf) / (tr * rf + tw * (1 - rf)), s = amdahl(p, n);
      return { q: `<p>A thread pool: ${Math.round(rf * 100)} % readers (${tr} s each, can run in parallel), ${Math.round((1 - rf) * 100)} % writers (${tw} s each, can't). Upper bound for the speedup on ${n} cores?</p>`,
        opts: ppOpts(fx(s), [fx(amdahl(rf, n)), fx(1 / (1 - p)), fx(n * p), fx(s + 0.5)]),
        why: `p is the share of <b>time</b>: ${tr}·${rf} / (${tr}·${rf} + ${tw}·${fx(1 - rf, 2)}) ≈ ${fx(p)}. S = 1 / ((1 − p) + p/${n}) ≈ ${fx(s)}.` };
    }
    const p = pick([0.5, 0.6, 0.75, 0.8, 0.9, 0.95]), n = pick([2, 4, 8, 16]);
    const lim = Math.random() < 0.3;
    const right = lim ? fx(1 / (1 - p)) : fx(amdahl(p, n));
    return { q: `<p>${p * 100} % of a program can run in parallel. ${lim ? "What is the largest speedup any number of processors can give?" : `What speedup does Amdahl's law give for n = ${n}?`}</p>`,
      opts: ppOpts(right, lim ? [String(n), "∞", fx(p * 10), fx(amdahl(p, 8))] : [fx(n * p), fx(1 / (1 - p)), fx(1 / (p + (1 - p) / n)), String(n)]),
      why: lim ? `n → ∞: S → 1 / (1 − p) = 1 / ${fx(1 - p)}.` : `S(${n}) = 1 / (${fx(1 - p)} + ${p}/${n}) = ${right}.` };
  },
});

ppR({
  id: "ptr", ch: 6, name: "C pointer expressions", about: "&, *, arithmetic, arrays",
  make() {
    const a = rlist(4, 1, 9), s = rint(0, 2), k = rint(0, 3 - s), m = rint(1, 5);
    const forms = [
      [`*(a + ${k})`, a[k], `the element at index ${k}`],
      [`*a + ${m}`, a[0] + m, `* binds tighter than +: a[0] + ${m}`],
      [`p[${k}]  /* int *p = a + ${s}; */`, a[s + k], `p points to a[${s}], so p[${k}] is a[${s + k}]`],
      [`*(p + ${k}) - *p  /* int *p = a + ${s}; */`, a[s + k] - a[s], `a[${s + k}] − a[${s}]`],
      [`*(*(c + 1) + ${k}) + ${m}  /* int *b = a; int *c[] = { a, b }; */`, a[k] + m, `c[1] is b, which points to a[0]; then a[${k}] + ${m}`],
    ];
    const [e, v, why] = pick(forms);
    return { q: `<p>${cq(`int a[] = { ${a.join(", ")} };`)} — what is the value of</p>${ccode(e)}`,
      opts: ppOpts(String(v), [String(a[0] + m), String(a[Math.min(3, k + 1)]), String(a[k]), String(v + 1), String(a[s]), String(v - 1), String(v + 2), String(v * 2 + 1)]),
      why: `${why} = ${v}.` };
  },
});

// A random C declaration, built from the inside out, so its reading is known.
function ppRandDecl() {
  const name = pick(["x", "p", "f", "arr", "fp"]);
  let d = name;
  const ops = Array.from({ length: rint(2, 3) }, () => pick(["ptr", "ptr", "arr", "fn"]));
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i], prev = ops[i - 1];
    if (op === "ptr") d = `*${d}`;
    else {
      if (prev === "ptr") d = `(${d})`;
      if (op === "arr") { if (prev === "fn") return ppRandDecl(); d = `${d}[${rint(2, 9)}]`; }
      else { if (prev === "fn" || prev === "arr") return ppRandDecl(); d = `${d}()`; }
    }
  }
  return `${pick(["int", "char", "double", "unsigned int"])} ${d};`.replace(/ \*/g, " *");
}
ppR({
  id: "decl", ch: 6, name: "Read a C declaration", about: "pointers, arrays and functions",
  make() {
    const d = ppRandDecl(), say = cdeclText(cdecl(d).steps) + ".";
    const others = Array.from({ length: 12 }, ppRandDecl).filter((x) => x !== d).map((x) => cdeclText(cdecl(x).steps) + ".");
    const swapped = say.replace(/pointer to (.*?) (array\[\d+\] of|function returning)/, "$2 pointer to $1");
    return { q: `<p>What does this declare?</p>${ccode(d)}`, opts: ppOpts(say, [swapped, ...others].filter((x) => x !== say)), why: `Start at the name, go right for [] and (), then left for *: ${say}` };
  },
});

ppR({
  id: "mpi", ch: 6, name: "MPI: finish or deadlock?", about: "blocking sends and receives",
  make() {
    const k = pick(Object.keys(PP_MPI_SCEN));
    const S = PP_MPI_SCEN[k], R = mpiRun(k);
    const right = R.done ? "All ranks finish" : R.stuck.length === S.np ? "Deadlock: every rank blocks" : `Rank ${R.stuck.join(", ")} waits for ever, the others finish`;
    return { q: `<p>Run with ${cq(`mpirun -np ${S.np}`)}. What happens?</p>${ccode(S.src)}`,
      opts: ppOpts(right, ["All ranks finish", "Deadlock: every rank blocks", "Rank 2 waits for ever, the others finish", "It depends on the output order"]),
      why: { ok: "The receive on rank 1 matches rank 0's send.", np3: "Rank 2 runs the else branch too and waits for a message only sent to rank 1.", recvFirst: "Both block in MPI_Recv before anyone sends.", sendFirst: "Standard-mode sends buffered both messages, so both receives find theirs (not guaranteed without buffer space).", ssend: "Synchronous sends wait for a receive that is never reached.", ordered: "One side sends while the other receives." }[k] };
  },
});

ppR({
  id: "coll", ch: 6, name: "Collective operations", about: "which one, and the counts",
  make() {
    if (Math.random() < 0.4) {
      const np = pick([2, 3, 4]), per = rint(2, 4), total = np * per;
      return { q: `<p>${total} ints on the root are to be split evenly over ${np} processes with ${cq("MPI_Scatter")}. What are sendcount and recvcount?</p>`,
        opts: ppOpts(`${per} and ${per}`, [`${total} and ${per}`, `${total} and ${total}`, `${np} and ${np}`, `${per} and ${total}`]), why: "Counts are per process, on both sides." };
    }
    const items = [
      ["Every process needs the same configuration value from rank 0.", "MPI_Bcast"],
      ["The root holds an array; each process should get its own equal-sized piece.", "MPI_Scatter"],
      ["Each process computed one partial result; the root needs all of them, in rank order.", "MPI_Gather"],
      ["Each process computed one value; every process needs all values.", "MPI_Allgather"],
      ["Each process needs the global maximum of all processes' values.", "MPI_Allreduce"],
      ["Only the root needs the sum of everyone's value.", "MPI_Reduce"],
      ["Process r needs the sum of the values of ranks 0 … r.", "MPI_Scan"],
      ["Process s has one item for every process r, which must end up at r (a transpose).", "MPI_Alltoall"],
    ];
    const [q, r] = pick(items);
    return { q: `<p>${q} Which collective?</p>`, opts: ppOpts(cq(r), shuffle(items.map((x) => x[1]).filter((x) => x !== r)).map(cq)), why: `${r}. (And remember: every process calls it.)` };
  },
});

ppR({
  id: "race", ch: 7, name: "Race conditions", about: "what values are possible",
  make() {
    const n = rint(2, 5);
    const kinds = [
      { q: `${n} threads each run once (c starts at 0, no synchronisation):`, src: "int _c = c;\n_c = _c + 1;\nc = _c;", r: `any value from 1 to ${n}`, w: [`only ${n}`, `0 to ${n}`, "only 1", `1 or ${n}`], why: `At worst all read 0 before anyone writes (1); at best they take turns (${n}).` },
      { q: `${n} threads each run once; c is declared volatile:`, src: "c = c + 1;", r: `any value from 1 to ${n}`, w: [`only ${n}`, "only 1", `0 to ${n}`], why: "volatile makes the single read and write visible, not the read-modify-write atomic." },
      { q: `${n} threads each run once inside synchronized (this):`, src: "synchronized (this) {\n  c = c + 1;\n}", r: `only ${n}`, w: [`any value from 1 to ${n}`, "only 1", `0 to ${n}`], why: "The whole read-modify-write is one critical section." },
      { q: `${n} threads each run once with an AtomicInteger c:`, src: "c.incrementAndGet();", r: `only ${n}`, w: [`any value from 1 to ${n}`, "only 1", `0 to ${n}`], why: "incrementAndGet is atomic." },
    ];
    const K = pick(kinds);
    return { q: `<p>${K.q} what can c be afterwards?</p>${jcode(K.src)}`, opts: ppOpts(K.r, K.w), why: K.why };
  },
});

ppR({
  id: "hbq", ch: 7, name: "Happens-before", about: "visible or not?",
  bank: [
    ["Thread A writes x, then calls t.start(). Thread t reads x.", true, "Everything before Thread.start happens-before the new thread."],
    ["Thread t writes x and ends. main calls t.join(), then reads x.", true, "Thread.join creates the relation."],
    ["Thread A writes x inside synchronized (m). Later thread B reads x inside synchronized (m).", true, "Same monitor: the earlier block happens-before the later one."],
    ["Thread A writes x inside synchronized (m1). Later thread B reads x inside synchronized (m2).", false, "Different monitors connect nothing."],
    ["Thread A writes x, then writes volatile flag. Thread B reads flag (sees the new value), then reads x.", true, "volatile write → later volatile read, and program order on both sides (transitive)."],
    ["Thread A writes x. Thread B, started earlier, reads x — no synchronisation.", false, "No relation: B may see an old value."],
    ["Thread A writes x, then reads x.", true, "Program order inside one thread."],
    ["Thread A writes volatile flag, then writes x. Thread B reads flag, then reads x.", false, "x is written after the volatile write, so nothing orders it before B's read."],
    ["main submits a task that writes x, then calls future.get() and reads x.", true, "get() waits for the task, like join."],
  ],
  make() {
    const [s, yes, why] = pick(this.bank);
    return { q: `<p>Is the write to x guaranteed to be visible at the read?</p><p>${s}</p>`, opts: ppOpts(yes ? "Yes — there is a happens-before relation" : "No — no happens-before relation", [yes ? "No — no happens-before relation" : "Yes — there is a happens-before relation", "Only on a single-core machine", "Only if x is an int"]), why };
  },
});

ppR({
  id: "javaq", ch: 7, name: "Java threads: concepts", about: "monitors, signals, deadlocks, executors",
  bank: [
    ["Which method actually starts a new thread?", "start()", ["run()", "join()", "notify()"], "run() would execute in the current thread."],
    ["wait() should be called …", "in a while loop that re-checks the condition", ["in an if statement", "outside synchronized", "only from main"], "Spurious wake-ups and foreign signals."],
    ["Calling wait() without holding the object's monitor gives …", "IllegalMonitorStateException", ["InterruptedException", "a deadlock", "nothing"], "You must be inside synchronized on that object."],
    ["Which Coffman conditions always hold with synchronized?", "mutual exclusion and no preemption", ["hold and wait and circular wait", "all four", "none"], "The other two depend on how locks are nested."],
    ["A thread waits for a signal that will never come. How do you end it cleanly?", "t.interrupt()", ["t.stop()", "notify() on another object", "Thread.sleep()"], "wait() then throws InterruptedException."],
    ["What does ExecutorService.submit(callable) return?", "a Future", ["the result", "a Thread", "void"], "get() on the Future blocks until the result is ready."],
    ["Which avoids hold-and-wait when you need two locks?", "tryLock() on both, release both if either fails", ["synchronized on both, nested", "volatile fields", "notifyAll()"], "Take all or nothing."],
    ["What do actors share?", "nothing — they only exchange messages", ["the heap", "a mailbox", "their state"], "State stays inside the actor."],
    ["CountDownLatch vs CyclicBarrier: which can be reused?", "CyclicBarrier", ["CountDownLatch", "both", "neither"], "A latch stays open once it reached 0."],
    ["Why use notifyAll() rather than notify()?", "notify() may wake a thread that can't proceed, and the signal is lost", ["notifyAll() is faster", "notify() is deprecated", "notify() releases the monitor"], "The lecture's rule: in a robust program every notify() can be a notifyAll()."],
  ],
  make() {
    const [q, r, w, why] = pick(this.bank);
    return { q: `<p>${q}</p>`, opts: ppOpts(r, w), why };
  },
});

ppR({
  id: "jml", ch: 8, name: "Who broke the contract?", about: "client or supplier",
  make() {
    const k = rint(0, 3), a = rint(-4, 6), b = rint(-2, 4), buggy = Math.random() < 0.5;
    const pre = b > k;
    const res = buggy && a < 0 ? 1 : a < 0 ? 0 : a - b;
    const postOk = a >= 0 ? res === a - b : res === 0;
    const right = !pre ? "The caller: the precondition is false" : postOk ? "Nobody: the contract is kept" : "The method: its postcondition fails";
    return { q: `${jcode(`//@ requires b > ${k};\n//@ ensures a >= 0 ==> \\result == a - b;\n//@ ensures a < 0 ==> \\result == 0;\npublic int f(int a, int b) {\n  if (a < 0) return ${buggy ? 1 : 0};\n  return a - b;\n}`)}<p>The call is ${j(`f(${a}, ${b})`)}. Who is at fault?</p>`,
      opts: ppOpts(right, ["The caller: the precondition is false", "Nobody: the contract is kept", "The method: its postcondition fails", "Both"]),
      why: !pre ? `b = ${b} is not > ${k}: the client broke its obligation, so the method owes nothing.` : `The precondition holds, the method returns ${res}; ${postOk ? "that's what the postcondition demands." : "the postcondition demands 0 for a < 0."}` };
  },
});

ppR({
  id: "lsp", ch: 8, name: "Liskov substitution", about: "may the subclass do that?",
  make() {
    const P = Object.keys(PP_PRES), Q = Object.keys(PP_POSTS);
    const [ps, pb, qs, qb] = [pick(P), pick(P), pick(Q), pick(Q)];
    const bad = (A, B) => { for (let v = -10; v <= 20; v++) if (A(v) && !B(v)) return true; return false; };
    const preBad = bad(PP_PRES[ps], PP_PRES[pb]), postBad = bad(PP_POSTS[qb], PP_POSTS[qs]);
    const right = preBad && postBad ? "No: stronger precondition and weaker postcondition" : preBad ? "No: the precondition got stronger" : postBad ? "No: the postcondition got weaker" : "Yes, Liskov holds";
    return { q: `${codePair(jcode(`// Super\n//@ requires ${ps};\n//@ ensures ${qs};\nint f(int x)`), jcode(`// Sub extends Super, overrides f\n//@ requires ${pb};\n//@ ensures ${qb};\nint f(int x)`))}<p>Is the override allowed?</p>`,
      opts: ppOpts(right, ["Yes, Liskov holds", "No: the precondition got stronger", "No: the postcondition got weaker", "No: stronger precondition and weaker postcondition"]),
      why: "Pre_super ⇒ Pre_sub (accept at least as much) and Post_sub ⇒ Post_super (promise at least as much)." };
  },
});

/* ---------------------------------------------------------------- Cheat sheet */

PROPA_SHEET.push(
  ["Parallel basics", [
    ["Amdahl's law", "S(n) = 1 / ((1 - p) + p / n)    limit 1 / (1 - p)", "p: share of running time that is parallel.", "5.2", "c"],
    ["Flynn", "SISD  SIMD  MISD  MIMD", "Instruction × data; multi-core is MIMD, MPI is SPMD.", "5.1", "c"],
    ["Parallel sum", "for h := 1 to log2(n): a[i] := a[2i] + a[2i+1]   pardo", "O(log n) steps.", "5.2", "c"],
  ]],
  ["C", [
    ["Pointers", "int *p = &i;  int j = *p;", "& address of, * value at.", "6.1", "c"],
    ["Arithmetic", "*(p + 1) == p[1]    p + 1 moves sizeof(*p) bytes", "", "6.1", "c"],
    ["Pass by pointer", "void incr(int *i) { (*i)++; }   incr(&x);", "C only passes by value.", "6.1", "c"],
    ["Heap", "int *a = malloc(n * sizeof(int)); … free(a);", "No garbage collection.", "6.1", "c"],
    ["Declarations", "unsigned int* const *(*next)();", "Name, right for [] (), left for * const.", "6.2", "c"],
  ]],
  ["MPI", [
    ["Frame", "MPI_Init(&argc, &argv);\nMPI_Comm_size(MPI_COMM_WORLD, &size);\nMPI_Comm_rank(MPI_COMM_WORLD, &rank);\n…\nMPI_Finalize();", "", "6.3", "c"],
    ["Send / Recv", "MPI_Send(buf, count, MPI_INT, dest, tag, comm);\nMPI_Recv(buf, count, MPI_INT, src, tag, comm, &status);", "Blocking. MPI_ANY_SOURCE, MPI_ANY_TAG.", "6.3", "c"],
    ["Modes", "MPI_Send  MPI_Ssend  MPI_Bsend  MPI_Rsend  MPI_Isend/Irecv + MPI_Test/Wait", "standard, synchronous, buffered, ready; non-blocking.", "6.3", "c"],
    ["Collectives", "MPI_Bcast  MPI_Scatter  MPI_Gather  MPI_Allgather  MPI_Alltoall\nMPI_Reduce  MPI_Allreduce  MPI_Scan  MPI_Barrier", "Counts are per process; everyone calls them.", "6.4", "c"],
  ]],
  ["Java threads", [
    ["Start a thread", "Thread t = new Thread(() -> work());\nt.start(); t.join();", "start() once; run() would not start a thread.", "7.1", "java"],
    ["Critical section", "synchronized (obj) { … }    synchronized void m() { … }", "Reentrant monitor (this / class object).", "7.1", "java"],
    ["Guarded wait", "synchronized (m) {\n  while (!cond) m.wait();\n  …\n  m.notifyAll();\n}", "wait releases the monitor.", "7.2", "java"],
    ["Visibility", "volatile boolean working;", "No caching or reordering; not atomic for x = x + 1.", "7.3", "java"],
    ["Atomics", "count.compareAndSet(prev, prev + 1)", "Non-blocking, optimistic.", "7.4", "java"],
    ["Executor + Future", "ExecutorService pool = Executors.newFixedThreadPool(4);\nFuture<Integer> f = pool.submit(() -> 42);\nf.get(); pool.shutdown();", "get() blocks.", "7.4", "java"],
    ["Streams", "list.parallelStream().filter(P::ok).mapToInt(P::age).average()", "Lazy; parallel merges with the combiner.", "7.4", "java"],
  ]],
  ["Design by Contract", [
    ["Hoare triple", "{x >= 9} x := x + 5 {x >= 13}", "If P before, then Q after.", "8.1", "java"],
    ["JML method", "/*@ requires size > 0;\n  @ ensures size == \\old(size) - 1;\n  @ ensures \\result == \\old(top());\n  @*/", "", "8.2", "java"],
    ["JML more", "//@ invariant size >= 0;\n/*@ pure @*/  //@ assignable \\nothing;\n//@ signals (E e) P;   (\\forall int i; 0 <= i && i < n; …)", "", "8.2", "java"],
    ["Liskov", "Pre_super ==> Pre_sub      Post_sub ==> Post_super      Inv_sub ==> Inv_super", "Weaker pre, stronger post.", "8.3", "java"],
  ]],
);

PROPA_TERMS.push(
  ["Amdahl's law", "Speedup bound 1 / ((1 − p) + p/n); the serial part limits it.", "5.2"],
  ["concurrency", "At least two threads make progress (maybe taking turns).", "5.1"],
  ["parallelism", "At least two threads run at the same moment.", "5.1"],
  ["shared memory", "All processors access the same memory; threads, Java.", "5.1"],
  ["distributed memory", "Each processor has its own memory; messages, MPI.", "5.1"],
  ["Flynn's taxonomy", "SISD, SIMD, MISD, MIMD: instruction streams × data streams.", "5.1"],
  ["task parallelism", "Splitting the work into different, independent tasks.", "5.2"],
  ["data parallelism", "The same operation on different parts of the data.", "5.2"],
  ["pointer arithmetic", "p + n moves n elements (n · sizeof(*p) bytes).", "6.1"],
  ["volatile (C)", "Always read from memory; no register caching or optimisation.", "6.2"],
  ["rank", "A process's number in a communicator, 0 … size − 1.", "6.3"],
  ["communicator", "A group of MPI processes that can talk; MPI_COMM_WORLD has all.", "6.3"],
  ["blocking (MPI)", "The call returns when its buffer may be used again.", "6.3"],
  ["synchronous send", "Returns only after the matching receive started (rendezvous).", "6.3"],
  ["collective operation", "Called by all processes of a communicator: Bcast, Scatter, Reduce …", "6.4"],
  ["MapReduce", "Map to key–value pairs, shuffle by key, reduce per key.", "6.4"],
  ["critical section", "Code only one thread at a time may run.", "7.1"],
  ["monitor", "Java's lock on an object: synchronized, reentrant, with a wait set.", "7.1"],
  ["spurious wake-up", "A thread leaves wait() without a signal — hence the while loop.", "7.2"],
  ["Coffman conditions", "Mutual exclusion, hold and wait, no preemption, circular wait.", "7.2"],
  ["happens-before", "If s₁ hb s₂, s₁'s writes are visible to s₂.", "7.3"],
  ["memory consistency error", "Threads see different values for the same data (caching, reordering).", "7.3"],
  ["compare-and-set", "Atomically replace a value only if it still has the expected old value.", "7.4"],
  ["Future", "The (later) result of an asynchronous computation; get() blocks.", "7.4"],
  ["actor", "Isolated state + mailbox; communicates only by asynchronous messages.", "7.4"],
  ["precondition", "What the client must ensure before the call.", "8.1"],
  ["postcondition", "What the supplier guarantees afterwards, if the precondition held.", "8.1"],
  ["Hoare triple", "{P} C {Q}: if P holds before C, Q holds after.", "8.1"],
  ["non-redundancy principle", "A routine's body shall not test its own precondition.", "8.1"],
  ["class invariant", "A condition that holds in every client-visible state.", "8.2"],
  ["Liskov substitution principle", "Subclasses: weaker or equal pre, stronger or equal post and invariants.", "8.3"],
  ["precondition availability", "Everything in a precondition must be visible to the method's clients.", "8.3"],
);
PROPA_COMPLEXITY.push(
  ["parallel sum, n processors", "O(log n)", "pairs added in each step"],
  ["odd-even transposition sort, n processors", "O(n)", "n phases of O(1)"],
  ["bubble sort (sequential)", "O(n²)", "n(n − 1)/2 comparisons"],
);
