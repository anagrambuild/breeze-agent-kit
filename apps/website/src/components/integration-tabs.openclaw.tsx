export function OpenclawIntegrationTab() {
	return (
		<div>
			<p className="text-sm text-dim mb-6">
				Install the Breeze skill directly from <a href="https://clawhub.dev">Clawhub</a> - no manual
				config needed.
			</p>

			<h3 className="text-sm font-bold mb-3">Install</h3>
			<pre className="mb-6">{`npx openclaw install breeze`}</pre>

			<p className="text-xs text-dim">
				More details coming soon. Visit <a href="https://clawhub.dev">clawhub.dev</a> to browse
				available skills.
			</p>
		</div>
	);
}
