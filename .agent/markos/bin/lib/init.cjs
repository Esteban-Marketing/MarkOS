/**
 * Init — Context builder for each MARKOS workflow command
 * Returns JSON with all context an orchestrator needs
 */

const fs = require('fs');
const path = require('path');
const { output, error, planningPaths, markosPaths, findPhaseInternal, loadConfig, safeReadFile, toPosixPath, checkMirGates } = require('./core.cjs');

function resolveModel(config, agentType) {
  const profile = config.model_profile || 'balanced';
  const profiles = {
    quality: { researcher: 'opus', planner: 'opus', executor: 'sonnet', verifier: 'opus' },
    balanced: { researcher: 'sonnet', planner: 'sonnet', executor: 'sonnet', verifier: 'sonnet' },
    budget: { researcher: 'haiku', planner: 'sonnet', executor: 'haiku', verifier: 'haiku' },
    inherit: { researcher: 'inherit', planner: 'inherit', executor: 'inherit', verifier: 'inherit' },
  };
  const map = profiles[profile] || profiles.balanced;
  return map[agentType] || 'sonnet';
}

function cmdInit(cwd, command, args, raw) {
  const pp = planningPaths(cwd);
  const mp = markosPaths(cwd);
  const config = loadConfig(cwd);

  const planningExists = fs.existsSync(pp.planning);
  const stateExists = fs.existsSync(pp.state);
  const roadmapExists = fs.existsSync(pp.roadmap);
  const projectExists = fs.existsSync(pp.project);
  const markosExists = fs.existsSync(mp.root);
  const hasGit = fs.existsSync(path.join(cwd, '.git'));

  // Check MIR gates
  let mirGates = null;
  if (fs.existsSync(mp.mir)) {
    mirGates = checkMirGates(mp.mir);
  }

  const base = {
    planning_exists: planningExists,
    state_exists: stateExists,
    roadmap_exists: roadmapExists,
    project_exists: projectExists,
    markos_exists: markosExists,
    has_git: hasGit,
    commit_docs: config.commit_docs,
    parallelization: config.parallelization,
    mir_gate_enforcement: config.mir_gate_enforcement,
    mir_gates: mirGates,
    state_path: stateExists ? toPosixPath(path.relative(cwd, pp.state)) : null,
    roadmap_path: roadmapExists ? toPosixPath(path.relative(cwd, pp.roadmap)) : null,
    requirements_path: fs.existsSync(pp.requirements) ? toPosixPath(path.relative(cwd, pp.requirements)) : null,
    project_path: projectExists ? toPosixPath(path.relative(cwd, pp.project)) : null,
    project_valid: false, // Default, will be overridden by findPhaseInternal if phase is found
  };

  switch (command) {
    case 'new-project':
      output({
        ...base,
        researcher_model: resolveModel(config, 'researcher'),
        synthesizer_model: resolveModel(config, 'planner'),
        roadmapper_model: resolveModel(config, 'planner'),
      }, raw);
      break;

    case 'plan-phase': {
      const phaseArg = args;
      const phaseInfo = phaseArg ? findPhaseInternal(cwd, phaseArg) : null;

      output({
        ...base,
        researcher_model: resolveModel(config, 'researcher'),
        planner_model: resolveModel(config, 'planner'),
        checker_model: resolveModel(config, 'verifier'),
        research_enabled: config.workflow?.research !== false,
        plan_checker_enabled: config.workflow?.plan_check !== false,
        phase_found: phaseInfo ? phaseInfo.found : false,
        phase_dir: phaseInfo ? phaseInfo.directory : null,
        phase_number: phaseInfo ? phaseInfo.phase_number : null,
        phase_name: phaseInfo ? phaseInfo.phase_name : null,
        phase_slug: phaseInfo ? phaseInfo.phase_slug : null,
        has_research: phaseInfo ? phaseInfo.has_research : false,
        has_context: phaseInfo ? phaseInfo.has_context : false,
        has_plans: phaseInfo ? phaseInfo.plans.length > 0 : false,
        plan_count: phaseInfo ? phaseInfo.plans.length : 0,
        context_path: phaseInfo && phaseInfo.has_context
          ? toPosixPath(path.join(phaseInfo.directory, `${phaseInfo.phase_number}-CONTEXT.md`))
          : null,
        research_path: phaseInfo && phaseInfo.has_research
          ? toPosixPath(path.join(phaseInfo.directory, `${phaseInfo.phase_number}-RESEARCH.md`))
          : null,
      }, raw);
      break;
    }

    case 'execute-phase': {
      const phaseArg = args;
      const phaseInfo = phaseArg ? findPhaseInternal(cwd, phaseArg) : null;

      output({
        ...base,
        executor_model: resolveModel(config, 'executor'),
        verifier_model: resolveModel(config, 'verifier'),
        phase_found: phaseInfo ? phaseInfo.found : false,
        phase_dir: phaseInfo ? phaseInfo.directory : null,
        phase_number: phaseInfo ? phaseInfo.phase_number : null,
        phase_name: phaseInfo ? phaseInfo.phase_name : null,
        phase_slug: phaseInfo ? phaseInfo.phase_slug : null,
        plans: phaseInfo ? phaseInfo.plans : [],
        incomplete_plans: phaseInfo ? phaseInfo.incomplete_plans : [],
        plan_count: phaseInfo ? phaseInfo.plans.length : 0,
        incomplete_count: phaseInfo ? phaseInfo.incomplete_plans.length : 0,
        verification_passed: phaseInfo ? phaseInfo.verification_passed : false,
        project_valid: phaseInfo ? phaseInfo.project_valid : false,
      }, raw);
      break;
    }

    default:
      output(base, raw);
  }
}

module.exports = { cmdInit };
