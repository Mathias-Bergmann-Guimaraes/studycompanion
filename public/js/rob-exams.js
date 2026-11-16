// Robotics I old exams: the test exam of WS 15/16 and the 22 exams from WS 15/16 to SS 26, each task
// summarised in our own words, tagged by topic and linked to its page in the exam and in the sample
// solution. The PDFs are KIT material: they live in public/rob-exams/ on the server only, under their
// original names (E22_SS_2026_Exam.pdf …), and are never committed (see .gitignore and the README).
//
// Until SS 24 the exam was in German, 45 points (SS 24: 46) in six to eight tasks; since WS 24/25 it is
// in English, 60 points in six tasks of about 10 points: transformations, kinematics/dynamics, motion
// planning, grasping, robot vision, programming by demonstration.

// Topics: the place of their lecture in ROB_PLAN (plan) and, once taught, the sections here.
const ROB_EXAM_TOPICS = {
  rot: { name: "Rotations & transforms", color: "var(--c-topic)", plan: 1, secs: ["1.3", "1.4", "1.5"] },
  quat: { name: "Quaternions", color: "var(--c-time)", plan: 1, secs: ["1.6", "1.7"] },
  dh: { name: "DH & forward kinematics", color: "var(--c-object)", plan: 2, secs: ["2.2", "2.3"] },
  jac: { name: "Jacobian & manipulability", color: "var(--c-point)", plan: 2, secs: ["2.4", "2.5"] },
  ws: { name: "Workspace & models", color: "var(--c-place)", plan: 2, secs: ["2.1", "2.6"] },
  ik: { name: "Inverse kinematics", color: "var(--c-with)", plan: 3, secs: ["3.1", "3.5"] },
  dyn: { name: "Dynamics", color: "var(--c-subject)", plan: 4, secs: [] },
  ctrl: { name: "Control", color: "var(--c-verb)", plan: 5, secs: [] },
  plan: { name: "Motion planning", color: "var(--c-also)", plan: 6, secs: [] },
  grasp: { name: "Grasping", color: "var(--c-dir)", plan: 7, secs: [] },
  vision: { name: "Robot vision", color: "#0891b2", plan: 8, secs: [] },
  pbd: { name: "Programming by demonstration", color: "#ca8a04", plan: 10, secs: [] },
  task: { name: "Symbolic planning (STRIPS)", color: "#65a30d", plan: 11, secs: [] },
};
const ROB_EXAM_TOPIC_IDS = Object.keys(ROB_EXAM_TOPICS);
// A topic counts as taught once its chapter is here. ("mc", the true/false task of the early exams,
// isn't a topic of its own.)
const rbTaught = (t) => !ROB_EXAM_TOPICS[t] || ROB_EXAM_TOPICS[t].plan <= ROB_CH_DONE;
const rbTopicLater = (t) => (ROB_EXAM_TOPICS[t] ? ROB_PLAN[ROB_EXAM_TOPICS[t].plan][2] : "");

// Each exam: file prefix, semester, date (ISO, "" if the cover gives none), total points, answer sheet?,
// and its tasks: [number, topic or [[topic, points], …], page in the exam, page in the solution, points, what the parts ask].
const ROB_EXAMS_RAW = [
  { id: "E22_SS_2026", sem: "SS 26", date: "2026-07-09", en: true, tasks: [
    [1, [["dyn", 4], ["rot", 5]], 2, 2, 9, ["drone with two lift forces: acceleration of its centre of mass in BCS", "angular acceleration about z", "homogeneous transformation of the drone (30° clockwise, at (5, 10, 0))", "an object seen by the drone's sensor, in BCS"]],
    [2, "dyn", 3, 3, 11, ["“Yeet Master 2000”: kinetic and potential energy with q = (θ, d)", "equation of motion by Lagrange in vector form"]],
    [3, "plan", 4, 5, 10, ["constraints vs quality criteria", "probabilistically complete", "two statements on RRT", "expand an RRT with two samples (d = 2)", "what makes a scenario hard for RRT, and an extension", "potential field: why the robot oscillates around the goal"]],
    [4, "grasp", 5, 7, 10, ["find the reference point of two wrenches", "GWS projections and ε-metrics; form closure?", "friction cone: convex hull of fₐ and f_b, its meaning", "friction coefficient from fₙ and fₐ"]],
    [5, "vision", 6, 9, 10, ["calibration matrix K: meaning of fₓ, f_y, cₓ, c_y; back-project two image points", "HSV vs RGB for colour segmentation", "morphology against noise pixels and holes", "Gaussian filter: larger σ", "Canny: three criteria; vs Sobel + threshold", "position- vs image-based visual servoing"]],
    [6, "pbd", 7, 11, 10, ["demonstrations shrink the search space", "what to imitate when pouring juice; two other challenges", "models in the observation step", "manual segmentation: pro and con", "dough: symbolic vs subsymbolic, how they combine"]],
  ] },
  { id: "E21_WS_2025-26", sem: "WS 25/26", date: "2026-03-30", en: true, tasks: [
    [1, [["dyn", 4], ["rot", 4]], 2, 2, 8, ["platform with three forces: acceleration", "angular acceleration", "pose after stopping at an obstacle", "the obstacle from the robot's local frame, in the world"]],
    [2, [["dh", 5], ["dyn", 7]], 3, 4, 12, ["forward kinematics of the end effector", "equation of motion in matrix form by Lagrange"]],
    [3, "plan", 4, 6, 10, ["configuration and configuration space; a humanoid with 31 DoF", "the two steps of search-based planning", "PRM vs potential fields", "RRT*: when q_new is added, what if not", "A* on a grid with Euclidean and Manhattan heuristics", "how A* avoids expanding a node twice"]],
    [4, "grasp", 5, 8, 10, ["what a wrench is", "contact points from wrenches", "shift the reference point: new wrenches, effect on the ε-metric", "why three frictionless contacts rarely give form closure", "an object without any form-closure grasp"]],
    [5, "vision", 6, 10, 10, ["extended camera model: project two points; intrinsic vs extrinsic; correspondences for calibration", "noise for the median filter", "horizontal and vertical edges at once", "the image Jacobian", "under- vs over-segmentation", "vision foundation models for robotics"]],
    [6, "pbd", 7, 13, 10, ["main goal of PbD; correspondence problem; not a playback", "which motion capture for a salad, for climbing a tree", "segmentation on semantic and motion level", "kinesthetic teaching vs human motion capture", "meaningful human control"]],
  ] },
  { id: "E20_SS_2025", sem: "SS 25", date: "2025-07-11", en: true, tasks: [
    [1, [["rot", 5], ["quat", 5]], 2, 2, 10, ["read a homogeneous matrix T", "rotation matrices of chained frames (WCS → RCS → ECS)", "the same as quaternions", "an advantage and a drawback of quaternions"]],
    [2, [["jac", 3], ["dh", 2], ["ws", 5]], 3, 4, 10, ["Jacobian J(q) of a 2-joint robot", "missing DH parameters", "singular configurations from det J (prismatic d₁)", "reachability maps: how built, what they store, why for grasping", "two geometric models for fast collision checks"]],
    [3, "plan", 4, 5, 10, ["Voronoi edges and why they are useful", "preprocessing for A* in continuous space", "A* vs Dijkstra", "pro and con of PRM", "potential field: forces at the start; why a quadratic attractive potential"]],
    [4, "grasp", 5, 6, 10, ["opening angle α of a friction triangle", "wrenches in the (fₓ, f_y) plane", "planar wrench", "grasp matrix: m and the conditions on k", "draw a medial axis"]],
    [5, "vision", 6, 8, 10, ["a colour model besides RGB; a 4 × 3 colour image", "extended vs classic pinhole model", "image coordinates", "ICP", "noise filters and their downside", "Sobel-Y by correlation"]],
    [6, "pbd", 7, 9, 10, ["when to imitate; what vs how", "why segment demonstrations", "judge a statement", "subsymbolic vs symbolic learning"]],
  ] },
  { id: "E19_WS_2024-25", sem: "WS 24/25", date: "2025-02-24", en: true, tasks: [
    [1, [["rot", 5], ["quat", 4], ["jac", 3]], 2, 2, 12, ["prove that R is a rotation matrix; R⁻¹", "an affine map as a homogeneous matrix", "p as a quaternion; q for a rotation about a by φ", "work with the quaternion s = 2 + i + 2k", "what the Jacobian maps"]],
    [2, [["dh", 3], ["dyn", 8]], 3, 4, 11, ["generalised coordinates; forward kinematics", "kinetic and potential energy", "Lagrange function", "equation of motion from a given Lagrangian"]],
    [3, "plan", 4, 6, 10, ["RRT*: path costs from q₁", "nearest neighbour, new node, rewiring, the tree after it", "why RRT struggles with narrow passages"]],
    [4, "grasp", 5, 8, 10, ["GWS projections; force closure?", "why the ε-value misleads here, and a fix", "why three contacts cannot give planar form closure"]],
    [5, "vision", 6, 10, 11, ["pinhole camera: object length in the image; focal length in the extended model", "RANSAC steps; a line model", "which calibration after changing the setup", "Prewitt-X convolution; a scaled filter", "two padding techniques", "position-based visual servoing loop"]],
    [6, "pbd", 7, 12, 6, ["PbD and two reasons", "the two levels of representation", "visualising a robot in a kitchen"]],
  ] },
  { id: "E18_SS_2024", sem: "SS 24", date: "2024-07-12", tasks: [
    [1, "rot", 2, 2, 7, ["two properties of a rigid body motion", "DoF of an element of SE(3)", "an object seen by the robot's camera: chain the poses"]],
    [2, [["jac", 3], ["dyn", 5]], 3, 4, 8, ["a robot with C ⊆ ℝ² and its workspace", "one-link arm: energies, Lagrange function, equation of motion"]],
    [3, "plan", 4, 5, 8, ["configuration space; its size for 8 joints", "match A*, potential fields and RRT* to three scenarios", "potential field: total force; local minima"]],
    [4, "grasp", 5, 6, 8, ["four factors in grasp generation", "what analysis and synthesis are given", "wrenches of a friction triangle", "medial axis"]],
    [5, "vision", 6, 8, 8, ["intrinsic vs extrinsic parameters; extended model and K", "a high-pass filter", "ICP", "the four RANSAC steps, pro and con"]],
    [6, "pbd", 7, 10, 7, ["two reasons for PbD", "four kinds of sensors to capture humans", "what to imitate", "segmenting a trajectory by extrema and zero crossings"]],
  ] },
  { id: "E17_WS_2023-24", sem: "WS 23/24", date: "2024-02-23", tasks: [
    [1, "rot", 2, 2, 6, ["homogeneous T₁ of frame F₁ in the world", "turn the hand about z₁", "rotation matrix R₃", "goal position of the grasp in the world"]],
    [2, [["dh", 5], ["jac", 2], ["dyn", 3]], 3, 3, 10, ["DH parameters of a 2-joint robot", "forward kinematics", "manipulability measures from A(θ)", "generalised coordinates; τ, M, C, g"]],
    [3, "plan", 4, 5, 8, ["the motion planning problem; range of the configuration space", "grid heuristics; admissible with diagonal moves?", "RRT with given samples", "a problem of RRT here"]],
    [4, "grasp", 5, 6, 8, ["Cutkosky's top level", "what a wrench is; its dimension in 2-D and 3-D", "friction triangle and its opening angle", "form vs force closure; a planar grasp"]],
    [5, "vision", 6, 7, 8, ["low- and high-pass filters", "calibrated camera for pose estimation", "extended camera model: project two points", "image memory and USB 2.0 bandwidth"]],
    [6, "pbd", 7, 8, 5, ["the four W questions", "motion segmentation; the criterion of hierarchical segmentation"]],
  ] },
  { id: "E16_SS_2023", sem: "SS 23", date: "2023-07-12", tasks: [
    [1, [["quat", 3], ["rot", 5]], 2, 2, 8, ["axis and angle of a quaternion", "the same rotation as a matrix", "the two conditions for R ∈ SO(3)", "SLERP", "Euler angles vs quaternions"]],
    [2, [["jac", 3], ["ik", 5]], 3, 4, 8, ["J(θ) at a configuration", "why the Moore–Penrose pseudoinverse; its formula", "J⁺(θ*)", "joint velocity for a desired end-effector velocity", "the pseudoinverse's problem — also at θ*?"]],
    [3, "plan", 4, 6, 8, ["force from a potential field", "attractive vs repulsive potential", "total force at a point", "local minima and a remedy"]],
    [4, "grasp", 5, 8, 8, ["assumption for force closure", "friction-cone wrenches; force closure?", "a grasp with the minimum number of contacts", "known vs unknown objects"]],
    [5, "vision", 6, 10, 8, ["memory of an RGB image; USB 2.0", "image coordinates of a point", "correspondences for calibration", "four padding methods", "hysteresis edge tracking"]],
    [6, "pbd", 7, 11, 5, ["four features of Harel statecharts", "a reason for PbD", "hierarchical segmentation"]],
  ] },
  { id: "E15_WS_2022-23", sem: "WS 22/23", date: "2023-02-23", tasks: [
    [1, [["rot", 6], ["quat", 1]], 2, 2, 7, ["homogeneous T₁ of frame F₁ in the world", "turn the hand by θ about z₁", "rotation matrix R₂", "goal position of the grasp in the world", "a drawback of rotation matrices vs quaternions"]],
    [2, "jac", 3, 3, 8, ["formula and computation of J(θ)", "manipulability matrix A(θ)", "A at θ*; mobility of the TCP there", "what J maps"]],
    [3, "plan", 4, 4, 10, ["complete vs probabilistically complete", "points in a Voronoi region", "pro and con of RRT", "rewiring in RRT*", "choose a planner", "draw on a planning problem"]],
    [4, "grasp", 5, 6, 7, ["form vs force closure", "wrenches of a friction triangle", "upper bound of the ε-metric", "medial axis of a 2-D object"]],
    [5, "vision", 6, 8, 8, ["filter for salt-and-pepper noise", "correlation vs convolution", "segmentation by thresholding", "extended camera model: project two points", "error functions in position- and image-based visual servoing"]],
    [6, "pbd", 6, 9, 5, ["learning levels in PbD", "motion segmentation and two criteria", "statecharts"]],
  ] },
  { id: "E14_SS_2022", sem: "SS 22", date: "2022-07-12", tasks: [
    [1, "rot", 2, 2, 6, ["rotation matrix from Euler angles with β = 0", "why β = 0 means gimbal lock", "two more drawbacks of Euler angles"]],
    [2, "jac", 2, 3, 7, ["define the manipulability matrix A(θ); compute it", "the three scalar manipulability measures", "two uses of them"]],
    [3, "ctrl", 3, 4, 7, ["match symbols to transfer elements", "PI controller in time and Laplace domain", "speed control loop"]],
    [4, "plan", 4, 5, 8, ["dimension of configuration spaces", "which class of planners", "A* on a graph", "an extra cost per node"]],
    [5, "grasp", 5, 7, 7, ["force closure intuitively; force- vs form-closure sets", "a spatial grasp with 6 contacts", "medial axis; grasps on a cylinder"]],
    [6, "vision", 6, 8, 7, ["calibrated camera for pose estimation", "Gaussian filter: parameters; apply it", "segmenting the smoothed image"]],
    [7, "pbd", 6, 9, 3, ["capture a subject's motion", "correspondence problem"]],
  ] },
  { id: "E13_WS_2021-22", sem: "WS 21/22", date: "2022-04-07", tasks: [
    [1, "rot", 2, 2, 6, ["axis and angle of R", "pose of a local frame from R and t", "the transformation OKS → BKS"]],
    [2, "jac", 2, 3, 8, ["Jacobian of f", "at a given θ", "end-effector velocity"]],
    [3, "ctrl", 3, 5, 7, ["match step responses to controllers", "PID in the time domain", "name the parts of a control loop"]],
    [4, [["ws", 3], ["plan", 4]], 4, 6, 7, ["configuration and configuration space; DoF on a holonomic platform", "planning problem with a fixed vs a moving target", "A*: discretisation and admissible heuristics"]],
    [5, "grasp", 5, 7, 7, ["grasp analysis vs synthesis", "medial axis: definition, draw it", "a planar grasp from its wrenches"]],
    [6, "vision", 5, 8, 7, ["segment a mug in a kitchen without windows", "camera calibration", "grey image after segmentation"]],
    [7, "pbd", 6, 9, 3, ["which programming method for four scenarios", "a reason for PbD"]],
  ] },
  { id: "E12_SS_2021", sem: "SS 21", date: "2021-07-13", tasks: [
    [1, "quat", 2, 2, 5, ["axis and angle of q", "q⁻¹", "rotate a point with q"]],
    [2, "jac", 2, 3, 6, ["compute the Jacobian", "end-effector velocity"]],
    [3, "ctrl", 3, 4, 6, ["draw and label a control loop", "angle from acceleration torque in time and frequency domain", "transfer function G(s)"]],
    [4, "plan", 3, 5, 8, ["the motion planning problem", "constraints, boundary conditions, quality criteria", "probabilistically complete", "bidirectional RRT"]],
    [5, "grasp", 4, 7, 8, ["number of wrenches; compute them", "size of the grasp matrix", "force and form closure", "with frictionless point contacts"]],
    [6, "vision", 5, 8, 6, ["calibration matrix", "convolution", "low- and high-pass filters", "Canny gradient directions"]],
    [7, "pbd", 5, 9, 6, ["correspondence problem", "three programming methods", "hierarchical segmentation"]],
  ] },
  { id: "E11_WS_2020-21", sem: "WS 20/21", date: "2021-04-08", tasks: [
    [1, [["dh", 4], ["jac", 4]], 2, 2, 8, ["DH parameters", "forward kinematics x = f(θ)", "Jacobian"]],
    [2, "dyn", 2, 4, 8, ["generalised coordinates; τ, M, C, g", "one-joint arm: energies, Lagrange function, equation of motion"]],
    [3, "plan", 3, 5, 6, ["RRT for a mobile robot", "the rewiring step of RRT*", "stochastic gradient planning with constraints"]],
    [4, "grasp", 4, 6, 8, ["GWS projections", "upper bound of the ε-metric", "force closure?", "contact model for these wrenches", "with frictionless point contacts"]],
    [5, "vision", 4, 8, 7, ["pinhole projection of (200, 200, 200)", "which function a filter approximates", "RANSAC: inliers; a perfect model?"]],
    [6, "pbd", 5, 9, 8, ["online vs offline programming", "implicit vs explicit programming", "main goal of PbD, two reasons", "three segmentation criteria"]],
  ] },
  { id: "E10_SS_2020", sem: "SS 20", date: "2020-06-16", tasks: [
    [1, [["dh", 8], ["rot", 3], ["quat", 1]], 2, 2, 12, ["joint types", "A₀,₁ and A₁,₂", "base → end effector", "position, axis–angle and quaternion of the end effector"]],
    [2, "dyn", 3, 6, 7, ["what a dynamic model relates", "direct or inverse dynamics for two applications", "recursive Newton–Euler"]],
    [3, "plan", 4, 7, 6, ["pro and con of sampling-based planners", "bridge sampling", "the key step of RRT*", "A* on a weighted graph"]],
    [4, "grasp", 5, 9, 6, ["definition of the medial axis; draw it", "grasp hypotheses from a medial-axis point cloud", "three heuristics"]],
    [5, "vision", 5, 10, 7, ["low- and high-pass filter with a use", "Canny: gradients and further steps", "camera images over a network"]],
    [6, "pbd", 6, 11, 7, ["two reasons for PbD", "the two levels of learning", "capturing a subject's motion", "passive vs active optical markers"]],
  ] },
  { id: "E09_WS_2019-20", sem: "WS 19/20", date: "2020-03-03", tasks: [
    [1, "quat", 2, 2, 5, ["unit quaternion for a rotation about an axis", "rotate p = (−1, 0, 0) with q = (1/√2, 0, 1/√2, 0)"]],
    [2, "jac", 2, 3, 7, ["size of the Jacobian", "compute it", "end-effector velocity"]],
    [3, "dyn", 3, 4, 7, ["what the equation of motion describes; generalised coordinates", "τ, M, C, g", "direct vs inverse dynamics", "recursive Newton–Euler"]],
    [4, "plan", 3, 5, 7, ["two kinds of constraints; why sampling struggles with them", "single- and multi-query planners, two differences", "the two steps of PRM"]],
    [5, "grasp", 4, 6, 6, ["draw the forces of grasp G_A", "friction-cone wrenches of G_B", "force closure from wrenches"]],
    [6, "vision", 5, 8, 6, ["3-D position with a pinhole camera", "correlation and convolution", "RANSAC steps and number of points"]],
    [7, "pbd", 5, 9, 7, ["the four W questions", "batch vs incremental learning", "hierarchical segmentation: both levels"]],
  ] },
  { id: "E08_SS_2019", sem: "SS 19", date: "2019-07-29", tasks: [
    [1, "rot", 2, 2, 4, ["is R a rotation matrix?", "translation of a homogeneous T"]],
    [2, "jac", 2, 3, 7, ["size of the Jacobian", "compute it", "end-effector velocity"]],
    [3, "dyn", 3, 4, 5, ["τ, M(q), c(q, q̇), g(q)", "recursive Newton–Euler", "two advantages over Lagrange"]],
    [4, "plan", 3, 5, 6, ["visibility graph around a square obstacle", "when its shortest path is optimal; in ℝ³?", "PRM vs RRT"]],
    [5, "grasp", 4, 6, 6, ["GWS projections", "force closure?"]],
    [6, "vision", 4, 7, 6, ["RGB (60, 30, 30) to HSI; why HSI", "opening and closing", "filter a grey image"]],
    [7, "task", 5, 8, 11, ["objects, agents and positions", "predicates", "define moveToPosition, grasp, handOver", "initial and goal state"]],
  ] },
  { id: "E07_WS_2018-19", sem: "WS 18/19", date: "2019-03-11", tasks: [
    [1, "rot", 1, 2, 6, ["prove that R is a rotation matrix", "R⁻¹", "rotation + translation as one homogeneous matrix"]],
    [2, [["dh", 4], ["jac", 3]], 2, 2, 7, ["A₀,₂ from two matrices", "DH parameters", "the Jacobian: end-effector vs joint velocities"]],
    [3, "dyn", 3, 3, 8, ["general equation of motion and its terms", "one-joint arm: energies, Lagrange function, generalised forces"]],
    [4, "plan", 4, 4, 6, ["two differences PRM vs RRT", "roadmap for a circular robot", "A* on a roadmap"]],
    [5, "grasp", 5, 6, 6, ["grasp analysis vs synthesis", "force closure intuitively; two quality measures", "approach vector and two more grasp parameters"]],
    [6, "vision", 6, 7, 7, ["camera calibration", "an RGB image", "ICP on a triangle: gradient, one update"]],
    [7, "task", 7, 8, 5, ["the five parts of a STRIPS state space", "closed list; state after an action; applicable actions"]],
  ] },
  { id: "E06_SS_2018", sem: "SS 18", date: "2018-07-24", tasks: [
    [1, "quat", 2, 2, 5, ["is quaternion multiplication commutative?", "S³ is a group", "axis and angle of q = (0, 1/√2, 1/√2, 0)"]],
    [2, [["dh", 3], ["jac", 4]], 2, 3, 7, ["DH parameters", "forward kinematics f(θ₁, θ₂) = (x, y, z, α, β, γ)", "Jacobian from it"]],
    [3, "ctrl", 3, 4, 7, ["current control loop of a motor", "motor in the frequency domain; transfer function", "PD controller in time and frequency domain"]],
    [4, "plan", 4, 5, 7, ["RRT*: path costs", "nearest neighbour and new node", "rewiring: which nodes, the tree after it"]],
    [5, "grasp", 5, 7, 7, ["opening angle of the friction triangles; draw them", "wrenches at their edges"]],
    [6, "vision", 5, 9, 6, ["pinhole camera fₓ = f_y = 200", "two properties of a linear filter", "a filter that shifts by one pixel", "filter a grey image"]],
    [7, "task", 6, 10, 6, ["is pickup(B, C) applicable?", "combine pickup and putdown", "pick any cup: a goal with variables"]],
  ] },
  { id: "E05_WS_2017-18", sem: "WS 17/18", date: "2018-03-16", tasks: [
    [1, "rot", 2, 2, 4, ["RPY angles of R", "pose of a local frame from R and t", "transform p from the object frame"]],
    [2, [["dh", 5], ["ws", 1]], 3, 3, 6, ["complete the DH table", "shape of the workspace", "what to add for every orientation in SE(3)"]],
    [3, "ctrl", 4, 4, 8, ["name the parts of a control loop", "speed control; extend to a cascade", "PI controller in time and frequency domain"]],
    [4, "plan", 5, 5, 7, ["A* on a numbered grid", "is Manhattan distance admissible in ℝ²?", "heuristic that makes A* = Dijkstra", "properties of A*"]],
    [5, "grasp", 6, 6, 6, ["GWS projections", "force closure?"]],
    [6, "vision", 6, 7, 8, ["pinhole camera f = 20 mm", "filter a grey image", "erosion"]],
    [7, "task", 7, 7, 6, ["minimal action sequence", "why no negated predicates", "a modified goal"]],
  ] },
  { id: "E04_SS_2017", sem: "SS 17", date: "2017-07-24", tasks: [
    [1, "quat", 2, 2, 4, ["axis and angle of q = (0.7, 0, 0.7, 0)", "q⁻¹", "SLERP vs linear interpolation; its problems"]],
    [2, [["dh", 9], ["ws", 1], ["jac", 1]], 2, 3, 11, ["complete the DH table", "revolute and prismatic joints", "shape of the workspace", "pose of a new end effector", "size of the Jacobian for 4 joints"]],
    [3, [["ctrl", 2], ["plan", 6]], 3, 4, 8, ["synchronous vs asynchronous PTP", "IK for interpolation in world coordinates?", "RRT for a mobile robot", "narrow passages"]],
    [4, "grasp", 4, 6, 7, ["Cutkosky's top level", "analysis vs synthesis", "two contact models", "force vs form closure", "synthesis on object parts"]],
    [5, "vision", 4, 7, 7, ["what the Prewitt filter approximates", "filter a grey image", "pinhole camera f = 20 mm", "two morphological operators"]],
    [6, "task", 5, 8, 8, ["shortest action sequence", "write a planning operator", "state after an action"]],
  ] },
  { id: "E03_WS_2016-17", sem: "WS 16/17", date: "2017-04-10", tasks: [
    [1, [["rot", 4], ["quat", 2]], 2, 2, 6, ["pose of a local frame from R and t", "transform p = (−200, 100, 100) from the world frame", "quaternion for θ = π; its conjugate"]],
    [2, [["dh", 8], ["ws", 1], ["jac", 2]], 2, 3, 11, ["complete the DH table", "revolute and prismatic joints", "shape of the workspace", "pose of a mounted end effector", "the two relations the Jacobian describes"]],
    [3, "plan", 3, 4, 7, ["cell decomposition by line sweep", "adjacency graph and shortest path", "two differences between planners"]],
    [4, "vision", 4, 5, 9, ["Prewitt masks; filter a grey image", "position- vs image-based visual servoing; interaction matrix", "SLAM"]],
    [5, "pbd", 4, 7, 7, ["the four W questions", "batch vs incremental learning", "four ways to record demonstrations"]],
    [6, "task", 5, 7, 5, ["STRIPS: shortest action sequence", "closed world assumption"]],
  ] },
  { id: "E02_SS_2016", sem: "SS 16", date: "2016-07-19", tasks: [
    [1, "quat", 2, 2, 5, ["quaternion for a rotation by θ about u", "its conjugate q*", "rotate v with q"]],
    [2, "plan", 2, 3, 4, ["what a Voronoi diagram is", "draw it for given points"]],
    [3, "ctrl", 3, 4, 9, ["two test functions for controllers", "match step responses", "match symbols to transfer elements", "complete a control loop"]],
    [4, "vision", 4, 6, 7, ["the four RANSAC steps", "three iterations by hand", "a model for the parameters"]],
    [5, "vision", 5, 8, 3, ["uses of low- and high-pass filters", "Prewitt masks"]],
    [6, "pbd", 5, 8, 4, ["four forms of interaction in programming", "four sensor types for PbD"]],
    [7, [["ik", 1], ["jac", 2], ["dh", 2]], 5, 9, 5, ["an everyday task for inverse kinematics", "what the Jacobian relates, its role", "a robot given by DH parameters"]],
    [8, "mc", 5, 10, 8, ["true/false across the lecture (±0.5 each)"]],
  ] },
  { id: "E01_WS_2015-16", sem: "WS 15/16", date: "2016-04-13", tasks: [
    [1, "rot", 2, 2, 6, ["RPY (XYZ fixed) angles of R", "homogeneous matrix from R and t = (100, 300, 100)", "transform p = (−200, 100, 100) from the world frame"]],
    [2, "ws", 3, 4, 4, ["define configuration space and workspace", "match robots 1–3 to their workspaces"]],
    [3, "plan", 3, 5, 8, ["PRM vs RRT", "RRT for a mobile robot"]],
    [4, "vision", 4, 6, 6, ["ICP error function", "ICP with a gradient method", "the update function"]],
    [5, "vision", 5, 7, 7, ["erosion and dilation", "Prewitt masks", "filter a grey image"]],
    [6, "pbd", 5, 7, 3, ["two online programming methods", "interactive robot programming"]],
    [7, [["ik", 1], ["ws", 2]], 5, 7, 3, ["forward vs inverse kinematics", "pros and cons of voxel models"]],
    [8, "mc", 6, 8, 8, ["true/false across the lecture (±0.5 each)"]],
  ] },
  { id: "E00_WS_2015-16_Test", sem: "WS 15/16 · test exam", date: "", noSheet: true, tasks: [
    [1, [["rot", 3], ["quat", 4]], 2, 2, 7, ["ZY′Z″ Euler angles of R", "the quaternion of R"]],
    [2, "dh", 3, 4, 7, ["DH parameters of the six joints of a PUMA arm"]],
    [3, [["ctrl", 2], ["grasp", 2], ["plan", 2], ["vision", 2]], 4, 5, 8, ["true/false: drives, grasping, path control and planning, image processing"]],
    [4, "ctrl", 5, 7, 10, ["block diagram of the system", "transfer function of the plant", "sketch the step responses"]],
    [5, "plan", 7, 8, 5, ["Voronoi diagram of a scene"]],
    [6, "ws", 8, 9, 3, ["match robots 1–3 to workspaces a–c"]],
    [7, "vision", 9, 9, 5, ["RANSAC: two iterations for a line, inliers at tolerance 2"]],
  ] },
];

const ROB_EXAMS = ROB_EXAMS_RAW.map((e) => ({
  ...e,
  file: `rob-exams/${e.id}_Exam.pdf`,
  solFile: `rob-exams/${e.id}_Sample-Solution.pdf`,
  sheetFile: e.noSheet ? null : `rob-exams/${e.id}_Answer-Sheet.pdf`,
  tasks: e.tasks.map(([n, topic, page, sol, pts, asks]) => {
    const split = Array.isArray(topic) ? topic : [[topic, pts]];
    return { n, topic: split[0][0], split, topics: split.map((s) => s[0]), page, solPage: sol, pts, asks, key: `${e.id}/${n}` };
  }),
}));

const rbExamView = { topic: "all", open: false, taught: false };
const rbExamDone = () => new Set(store.get("robExamDone", []));
const rbDate = (iso) => { if (!iso) return "no date"; const [y, m, d] = iso.split("-"); return `${+d}.${+m}.${y}`; };
const rbTopicPill = (t, pts) => !ROB_EXAM_TOPICS[t]
  ? `<span class="len-topic" style="--tc:var(--muted)">Multiple choice</span>`
  : `<span class="len-topic ${rbTaught(t) ? "" : "gk-later"}" style="--tc:${ROB_EXAM_TOPICS[t].color}" title="${rbTaught(t) ? "" : `comes with ${rbTopicLater(t)}`}">${ROB_EXAM_TOPICS[t].name}${pts !== undefined ? ` · ${pts}` : ""}</span>`;
// The exam topics that belong to a row of the semester plan (by its index).
const rbTopicsOfPlan = (i) => ROB_EXAM_TOPIC_IDS.filter((t) => ROB_EXAM_TOPICS[t].plan === i);

// Points per topic and exam, newest first, to see what always comes up.
function rbExamGrid() {
  const exams = ROB_EXAMS;
  return `<div class="rb-egrid-wrap"><div class="pp-egrid" style="--n:${exams.length}">
    <span></span>${exams.map((e) => `<span class="pp-eg-h">${e.sem.replace(" · test exam", " T")}</span>`).join("")}
    ${ROB_EXAM_TOPIC_IDS.map((t) => `<span class="pp-eg-t">${rbTopicPill(t)}</span>${exams.map((e) => {
      const pts = e.tasks.flatMap((x) => x.split).filter(([tt]) => tt === t).reduce((a, [, p]) => a + p, 0);
      return `<span class="pp-eg-c" style="--a:${pts ? 18 + (Math.min(pts, 12) / 12) * 70 : 0}%;--tc:${ROB_EXAM_TOPICS[t].color}">${pts || "–"}</span>`;
    }).join("")}`).join("")}
  </div></div><p class="small muted">Points per topic; mixed tasks are split by their parts. Pale: not in the lecture yet.</p>`;
}

function renderRobExams() {
  const v = rbExamView;
  const done = rbExamDone();
  const all = ROB_EXAMS.flatMap((e) => e.tasks);
  const match = (t) => (v.topic === "all" || t.topics.includes(v.topic)) && (!v.open || !done.has(t.key)) && (!v.taught || t.topics.some((x) => ROB_EXAM_TOPICS[x] && rbTaught(x)));
  const count = (topic) => all.filter((t) => topic === "all" || t.topics.includes(topic)).length;
  const shown = ROB_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);
  const recent = ROB_EXAMS.slice(0, 4).flatMap((e) => e.tasks);
  const recentPts = recent.reduce((a, t) => a + t.pts, 0);
  const recentTaught = recent.flatMap((t) => t.split).filter(([t]) => ROB_EXAM_TOPICS[t] && rbTaught(t)).reduce((a, [, p]) => a + p, 0);

  $("#rob-exams").innerHTML = `
    <div class="card hero">
      <h1>Old <span class="accent">exams</span></h1>
      <p>${ROB_EXAMS.length} exams: the test exam of WS 15/16 and every exam from WS 15/16 to SS 26. Until SS 24 they were in German with 45 points;
        since WS 24/25 they are in <b>English, 60 points in six tasks</b> of about 10 points: transformations, kinematics and dynamics, motion planning,
        grasping, robot vision, programming by demonstration.</p>
      <p class="small">The lecture is still running (chapters 0–${ROB_CH_DONE}): in the last four exams, <b>${recentTaught} of ${recentPts}</b> points belong to topics already here.
        “Task” opens the PDF on the right page, “Solution” the sample solution. Tick what you have done; “Review” takes you to the section,
        “Practise” to tasks of the same kind with new numbers — to train first and keep the real one for later.</p>
    </div>
    <div class="card">
      <h2>What comes up</h2>
      ${rbExamGrid()}
    </div>
    <div class="card">
      <h2>Format and rules</h2>
      <p class="small muted">From the cover sheets of the recent exams, in our own words.</p>
      ${ppFacts([
        ["Time and points", `Exam on ${ROB_EXAM.date}, ${ROB_EXAM.time} (${ROB_EXAM.minutes} minutes). Since WS 24/25: 60 points.`],
        ["Aids", "Only writing utensils. Pen with permanent black or blue ink — pencil, red or green ink do not count."],
        ["Answers", "Only in the boxes of the answer sheets; the question sheets are not handed in. Keep answers brief — the space does not say how long an answer should be."],
        ["Language", "English or German; you may switch between answers, not within one."],
        ["Calculations", "Show the steps and give units where asked (the newer tasks on forces and dynamics do)."],
      ])}
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Topic</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">All · ${count("all")}</button>
          ${ROB_EXAM_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""} ${rbTaught(t) ? "" : "gk-later"}" data-topic="${t}" style="--gc:${ROB_EXAM_TOPICS[t].color}">${ROB_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="rbExamTaught" ${v.taught ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Only tasks on topics already here</span></label>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="rbExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Only tasks still open</span></label>
      <p class="small muted len-filter-sum">${nShown} tasks in ${shown.length} exams · ${done.size} of ${all.length} done</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem} <span class="muted len-exam-date">· ${rbDate(e.date)}</span></h2>
            <span class="small muted">${e.tasks.length} tasks · ${e.tasks.reduce((s, t) => s + t.pts, 0)} points · ${e.en ? "English" : "German"}</span></div>
          <span class="pp-exam-files"><a class="btn" href="${e.file}" target="_blank" rel="noopener">Exam ↗</a><a class="btn" href="${e.solFile}" target="_blank" rel="noopener">Solution ↗</a>${e.sheetFile ? `<a class="btn" href="${e.sheetFile}" target="_blank" rel="noopener">Answer sheet ↗</a>` : ""}</span>
        </div>
        <div class="len-tasks">
          ${tasks.map((t) => {
            const sec = t.topics.map((x) => ROB_EXAM_TOPICS[x]).find((x) => x && x.secs.length);
            const later = t.topics.find((x) => ROB_EXAM_TOPICS[x] && !rbTaught(x));
            return `
            <div class="len-task pp-etask ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="Done"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">Task ${t.n}</b>
              <span class="nm-pills">${t.split.length > 1 ? t.split.map(([tt, p]) => rbTopicPill(tt, p)).join("") : rbTopicPill(t.topic)}</span>
              <span class="len-task-pts">${t.pts} P</span>
              <ul class="pp-asks">${t.asks.map((a) => `<li>${ppEsc(a)}</li>`).join("")}</ul>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">Task · p. ${t.page}</a>
                <a class="btn small-btn" href="${e.solFile}#page=${t.solPage}" target="_blank" rel="noopener">Solution · p. ${t.solPage}</a>
                ${sec ? `<button class="btn small-btn" type="button" data-sec="${sec.secs[0]}">Review ${sec.secs[0]}</button>` : ""}
                ${later ? `<span class="small muted gk-soon">${sec ? "partly " : ""}comes with ${rbTopicLater(later)}</span>` : ""}
                ${ROB_TASKS.some((g) => t.topics.includes(g.topic)) ? `<button class="btn small-btn primary" type="button" data-tasks="${t.topics.find((x) => ROB_TASKS.some((g) => g.topic === x))}">Practise</button>` : ""}
              </span>
            </div>`;
          }).join("")}
        </div>
      </div>`).join("") || `<p class="muted">No task matches this filter.</p>`}`;

  $$("#rob-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; renderRobExams(); }));
  $("#rbExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderRobExams(); };
  $("#rbExamTaught").onchange = (ev) => { v.taught = ev.target.checked; renderRobExams(); };
  $$("#rob-exams [data-done]").forEach((cb) => (cb.onchange = () => {
    const s = rbExamDone();
    cb.checked ? s.add(cb.dataset.done) : s.delete(cb.dataset.done);
    store.set("robExamDone", [...s]);
    track("rob.examDone");
    renderRobExams();
  }));
  $$("#rob-exams [data-sec]").forEach((b) => (b.onclick = () => openRobSection(b.dataset.sec)));
  $$("#rob-exams [data-tasks]").forEach((b) => (b.onclick = () => openRobTasks(b.dataset.tasks)));
}
