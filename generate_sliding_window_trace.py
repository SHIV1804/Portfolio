import json

def generate_sliding_window_trace(nums, k):
    trace = {
        "bruteForce": {
            "code": [
                "def max_sum_subarray_brute_force(nums, k):",
                "    max_sum = 0",
                "    for i in range(len(nums) - k + 1):",
                "        current_sum = 0",
                "        for j in range(i, i + k):",
                "            current_sum += nums[j]",
                "        max_sum = max(max_sum, current_sum)",
                "    return max_sum"
            ],
            "complexity": "O(N*K)",
            "steps": []
        },
        "optimized": {
            "code": [
                "def max_sum_subarray_sliding_window(nums, k):",
                "    max_sum = 0",
                "    window_sum = 0",
                "    window_start = 0",
                "    for window_end in range(len(nums)):",
                "        window_sum += nums[window_end]",
                "        if window_end >= k - 1:",
                "            max_sum = max(max_sum, window_sum)",
                "            window_sum -= nums[window_start]",
                "            window_start += 1",
                "    return max_sum"
            ],
            "complexity": "O(N)",
            "steps": []
        },
        "discoveryQuestions": [],
        "predictionQuestions": []
    }

    # Optimized (Sliding Window) Trace
    max_sum = 0
    window_sum = 0
    window_start = 0
    for window_end in range(len(nums)):
        window_sum += nums[window_end]
        trace["optimized"]["steps"].append({
            "line": 5, # window_sum += nums[window_end]
            "variables": {"window_sum": window_sum, "window_start": window_start, "window_end": window_end, "max_sum": max_sum},
            "highlightIndices": list(range(window_start, window_end + 1)),
            "explanation": f"Add nums[{window_end}] ({nums[window_end]}) to window_sum. Current window_sum: {window_sum}"
        })

        if window_end >= k - 1:
            trace["optimized"]["steps"].append({
                "line": 6, # if window_end >= k - 1:
                "variables": {"window_sum": window_sum, "window_start": window_start, "window_end": window_end, "max_sum": max_sum},
                "highlightIndices": list(range(window_start, window_end + 1)),
                "explanation": f"Window size reached k. Current window_sum: {window_sum}"
            })
            max_sum = max(max_sum, window_sum)
            trace["optimized"]["steps"].append({
                "line": 7, # max_sum = max(max_sum, window_sum)
                "variables": {"window_sum": window_sum, "window_start": window_start, "window_end": window_end, "max_sum": max_sum},
                "highlightIndices": list(range(window_start, window_end + 1)),
                "explanation": f"Update max_sum to {max_sum}"
            })
            window_sum -= nums[window_start]
            trace["optimized"]["steps"].append({
                "line": 8, # window_sum -= nums[window_start]
                "variables": {"window_sum": window_sum, "window_start": window_start, "window_end": window_end, "max_sum": max_sum},
                "highlightIndices": list(range(window_start + 1, window_end + 1)),
                "explanation": f"Subtract nums[{window_start}] ({nums[window_start]}) from window_sum. New window_sum: {window_sum}"
            })
            window_start += 1
            trace["optimized"]["steps"].append({
                "line": 9, # window_start += 1
                "variables": {"window_sum": window_sum, "window_start": window_start, "window_end": window_end, "max_sum": max_sum},
                "highlightIndices": list(range(window_start, window_end + 1)),
                "explanation": f"Slide window by incrementing window_start to {window_start}"
            })

    return trace

if __name__ == "__main__":
    nums = [2, 1, 5, 1, 3, 2]
    k = 3
    trace_data = generate_sliding_window_trace(nums, k)
    
    # Create the directory if it doesn't exist
    import os
    output_dir = "dsa-solutions/problems/sliding-window/max-sum-subarray"
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "trace.json"), "w") as f:
        json.dump(trace_data, f, indent=2)
    print(f"Generated trace.json for Maximum Sum Subarray of Size K in {output_dir}")

